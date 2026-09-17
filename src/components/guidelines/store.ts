import { writeSavedDocuments } from "./persistence";
import { TEMPLATES } from "./templates";
import { DEFAULT_TYPE, uid, type Block, type Brand, type CustomTemplate, type Project, type Slide } from "./types";

/**
 * One reducer owns every client deck. Undo history is per project and holds
 * whole snapshots — decks are small, and it makes "undo" mean exactly what it
 * did, however many blocks the action touched. Continuous gestures (a drag, a
 * resize) take one snapshot when they start and then patch without recording,
 * so undo steps back over the whole gesture, not every pixel of it.
 */

export const STORAGE_KEY = "darwin.guidelines.v1";
const HISTORY = 60;

export type State = {
  projects: Project[];
  currentId: string;
  /** Decks saved as starting points, alongside the built-in templates. */
  customTemplates: CustomTemplate[];
  slide: number;
  selection: string[];
  past: Project[];
  future: Project[];
};

export type Action =
  | { type: "new"; templateId: string; client: string }
  | { type: "newFromPages"; client: string; brand: Brand; slides: Slide[] }
  | { type: "open"; id: string }
  | { type: "deleteProject"; id: string }
  | { type: "rename"; client: string }
  | { type: "import"; project: Project }
  | { type: "brand"; patch: Partial<Brand> }
  | { type: "goto"; slide: number }
  | { type: "select"; ids: string[]; additive?: boolean }
  | { type: "snapshot" }
  | { type: "patch"; ids: string[]; patch: Partial<Block> | ((b: Block) => Block); transient?: boolean }
  | { type: "add"; block: Block }
  | { type: "remove"; ids: string[] }
  | { type: "duplicate"; ids: string[] }
  | { type: "order"; ids: string[]; dir: "front" | "back" | "forward" | "backward" }
  | { type: "slideAdd"; slide: Slide }
  | { type: "addPages"; slides: Slide[] }
  | { type: "slideRemove"; index: number }
  | { type: "slideMove"; from: number; to: number }
  | { type: "slideDuplicate"; index: number }
  | { type: "slidePatch"; patch: Partial<Pick<Slide, "name" | "bg" | "gradient">> }
  | { type: "slideReference"; patch: Partial<NonNullable<Slide["reference"]>> | null }
  | { type: "saveTemplate"; name: string }
  | { type: "deleteTemplate"; id: string }
  | { type: "undo" }
  | { type: "redo" };

/** Fresh ids throughout, so a copy never shares identity with its source. */
export function cloneSlides(slides: Slide[]): Slide[] {
  return slides.map((s) => ({ ...s, id: uid("p"), blocks: s.blocks.map((b) => ({ ...b, id: uid(b.kind[0]) })) }));
}

export function makeProject(templateId: string, client: string, custom: CustomTemplate[] = []): Project {
  const saved = templateId.startsWith("custom:") ? custom.find((c) => `custom:${c.id}` === templateId) : undefined;
  if (saved) {
    const brand = structuredClone(saved.brand);
    brand.name = client || brand.name;
    return { id: uid("proj"), templateId, client: client || saved.name, brand, slides: cloneSlides(saved.slides), updatedAt: Date.now() };
  }
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const brand: Brand = structuredClone(template.brand);
  brand.name = client || brand.name;
  return {
    id: uid("proj"),
    templateId: template.id,
    client: client || template.brand.name,
    brand,
    slides: template.slides(brand),
    updatedAt: Date.now(),
  };
}

export function current(state: State): Project {
  return state.projects.find((p) => p.id === state.currentId) ?? state.projects[0];
}

/** Decks saved before the type system existed get the default one. */
function migrateBrand(brand: Brand & { fonts?: unknown }): Brand {
  const { fonts, ...rest } = brand;
  void fonts;
  return { ...rest, type: rest.type ?? DEFAULT_TYPE, extras: rest.extras ?? [] };
}

export function init(savedDocuments?: string): State {
  const empty = { slide: 0, selection: [], past: [], future: [] };
  try {
    const raw = savedDocuments ?? localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { projects: Project[]; currentId: string; customTemplates?: CustomTemplate[] };
      if (saved.projects?.length) {
        return {
          ...empty,
          projects: saved.projects.map((p) => ({ ...p, brand: migrateBrand(p.brand) })),
          currentId: saved.currentId,
          customTemplates: (saved.customTemplates ?? []).map((c) => ({ ...c, brand: migrateBrand(c.brand) })),
        };
      }
    }
  } catch {
    // Corrupt or blocked storage — start fresh rather than refuse to open.
  }
  const first = makeProject("mold", "");
  return { ...empty, projects: [first], currentId: first.id, customTemplates: [] };
}

export function persist(state: State, onFail: (message: string) => void, onSaved?: (at: number) => void) {
  const at = Date.now();
  void writeSavedDocuments({ projects: state.projects, currentId: state.currentId, customTemplates: state.customTemplates })
    .then(() => onSaved?.(at))
    .catch(() => onFail("Could not save this deck in browser storage. Export JSON to keep a backup."));
}

/** Replace the current project, recording the previous one for undo. */
function commit(state: State, next: Project, record = true): State {
  const prev = current(state);
  const project = { ...next, updatedAt: Date.now() };
  return {
    ...state,
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    past: record ? [...state.past.slice(-(HISTORY - 1)), prev] : state.past,
    future: record ? [] : state.future,
  };
}

function withSlide(project: Project, index: number, fn: (s: Slide) => Slide): Project {
  return { ...project, slides: project.slides.map((s, i) => (i === index ? fn(s) : s)) };
}

export function reducer(state: State, action: Action): State {
  const project = current(state);
  const slide = project.slides[state.slide];
  const fresh = { slide: 0, selection: [], past: [], future: [] };

  switch (action.type) {
    case "new": {
      const next = makeProject(action.templateId, action.client, state.customTemplates);
      return { ...state, ...fresh, projects: [next, ...state.projects], currentId: next.id };
    }
    case "newFromPages": {
      const next: Project = {
        id: uid("proj"), templateId: "reference", client: action.client,
        brand: action.brand, slides: action.slides, updatedAt: Date.now(),
      };
      return { ...state, ...fresh, projects: [next, ...state.projects], currentId: next.id };
    }
    case "open":
      return { ...state, ...fresh, currentId: action.id };
    case "deleteProject": {
      const projects = state.projects.filter((p) => p.id !== action.id);
      if (!projects.length) {
        const first = makeProject("mold", "");
        return { ...state, ...fresh, projects: [first], currentId: first.id };
      }
      const currentId = action.id === state.currentId ? projects[0].id : state.currentId;
      return { ...state, ...fresh, projects, currentId };
    }
    case "rename":
      return commit(state, { ...project, client: action.client }, false);
    case "import": {
      const imported = { ...action.project, id: uid("proj"), brand: migrateBrand(action.project.brand), updatedAt: Date.now() };
      return { ...state, ...fresh, projects: [imported, ...state.projects], currentId: imported.id };
    }
    case "brand":
      return commit(state, { ...project, brand: { ...project.brand, ...action.patch } });
    case "goto":
      return { ...state, slide: Math.max(0, Math.min(project.slides.length - 1, action.slide)), selection: [] };
    case "select": {
      if (!action.additive) return { ...state, selection: action.ids };
      const set = new Set(state.selection);
      for (const id of action.ids) {
        if (set.has(id)) set.delete(id); else set.add(id);
      }
      return { ...state, selection: [...set] };
    }
    case "snapshot":
      return { ...state, past: [...state.past.slice(-(HISTORY - 1)), project], future: [] };
    case "patch": {
      const apply = typeof action.patch === "function"
        ? action.patch
        : (b: Block) => ({ ...b, ...(action.patch as object) } as Block);
      const next = withSlide(project, state.slide, (s) => ({
        ...s,
        blocks: s.blocks.map((b) => (action.ids.includes(b.id) ? apply(b) : b)),
      }));
      return commit(state, next, !action.transient);
    }
    case "add": {
      const next = withSlide(project, state.slide, (s) => ({ ...s, blocks: [...s.blocks, action.block] }));
      return { ...commit(state, next), selection: [action.block.id] };
    }
    case "remove": {
      const next = withSlide(project, state.slide, (s) => ({ ...s, blocks: s.blocks.filter((b) => !action.ids.includes(b.id)) }));
      return { ...commit(state, next), selection: [] };
    }
    case "duplicate": {
      const copies = slide.blocks
        .filter((b) => action.ids.includes(b.id))
        .map((b) => ({ ...b, id: uid(b.kind[0]), x: b.x + 24, y: b.y + 24 }));
      const next = withSlide(project, state.slide, (s) => ({ ...s, blocks: [...s.blocks, ...copies] }));
      return { ...commit(state, next), selection: copies.map((c) => c.id) };
    }
    case "order": {
      const blocks = [...slide.blocks];
      const picked = blocks.filter((b) => action.ids.includes(b.id));
      const rest = blocks.filter((b) => !action.ids.includes(b.id));
      let out: Block[];
      if (action.dir === "front") out = [...rest, ...picked];
      else if (action.dir === "back") out = [...picked, ...rest];
      else {
        out = blocks;
        const step = action.dir === "forward" ? 1 : -1;
        const indices = picked.map((b) => blocks.indexOf(b)).sort((a, b) => (step > 0 ? b - a : a - b));
        for (const i of indices) {
          const j = i + step;
          if (j < 0 || j >= out.length || action.ids.includes(out[j].id)) continue;
          [out[i], out[j]] = [out[j], out[i]];
        }
      }
      return commit(state, withSlide(project, state.slide, (s) => ({ ...s, blocks: out })));
    }
    case "slideAdd":
    case "addPages": {
      const incoming = action.type === "slideAdd" ? [action.slide] : action.slides;
      if (!incoming.length) return state;
      const at = state.slide + 1;
      const slides = [...project.slides.slice(0, at), ...incoming, ...project.slides.slice(at)];
      return { ...commit(state, { ...project, slides }), slide: at, selection: [] };
    }
    case "slideRemove": {
      if (project.slides.length <= 1) return state;
      const slides = project.slides.filter((_, i) => i !== action.index);
      return { ...commit(state, { ...project, slides }), slide: Math.min(state.slide, slides.length - 1), selection: [] };
    }
    case "slideMove": {
      const slides = [...project.slides];
      const [moved] = slides.splice(action.from, 1);
      slides.splice(action.to, 0, moved);
      return { ...commit(state, { ...project, slides }), slide: action.to };
    }
    case "slideDuplicate": {
      const src = project.slides[action.index];
      const [copy] = cloneSlides([{ ...src, name: `${src.name} copy` }]);
      const slides = [...project.slides.slice(0, action.index + 1), copy, ...project.slides.slice(action.index + 1)];
      return { ...commit(state, { ...project, slides }), slide: action.index + 1, selection: [] };
    }
    case "slidePatch":
      return commit(state, withSlide(project, state.slide, (s) => ({ ...s, ...action.patch })));
    case "slideReference":
      return commit(state, withSlide(project, state.slide, (s) => {
        if (action.patch === null) { const { reference, ...rest } = s; void reference; return rest; }
        return { ...s, reference: { src: "", opacity: 0.35, visible: true, ...s.reference, ...action.patch } };
      }));
    case "saveTemplate": {
      const saved: CustomTemplate = {
        id: uid("tpl"), name: action.name,
        brand: structuredClone(project.brand), slides: cloneSlides(project.slides),
      };
      return { ...state, customTemplates: [saved, ...state.customTemplates] };
    }
    case "deleteTemplate":
      return { ...state, customTemplates: state.customTemplates.filter((c) => c.id !== action.id) };
    case "undo": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === prev.id ? prev : p)),
        past: state.past.slice(0, -1),
        future: [project, ...state.future].slice(0, HISTORY),
        slide: Math.min(state.slide, prev.slides.length - 1),
        selection: [],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === next.id ? next : p)),
        past: [...state.past, project],
        future: state.future.slice(1),
        slide: Math.min(state.slide, next.slides.length - 1),
        selection: [],
      };
    }
  }
}

/** Downscale a dropped image before it is stored — localStorage is small and decks travel. */
export function shrinkImage(file: File, max = 1800): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL("image/webp", 0.86);
      resolve(webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not an image")); };
    img.src = url;
  });
}
