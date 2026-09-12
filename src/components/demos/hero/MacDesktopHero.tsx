"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./MacDesktopHero.module.css";
import { createDesktopFlow } from "./desktop-flow";

type PageId = "work" | "about" | "notes" | "library" | "botanical";
type DesktopWindow = { id: PageId; x: number; y: number; minimized: boolean; maximized: boolean };
const PAGES: Record<PageId, { title: string; label: string; icon: string }> = {
  work: { title: "Selected work", label: "Work", icon: "folder" },
  about: { title: "About Darwin", label: "About", icon: "face" },
  notes: { title: "Field notes", label: "Notes", icon: "notes" },
  library: { title: "The library", label: "Library", icon: "grid" },
  botanical: { title: "Botanical studies", label: "Botanical studies", icon: "flower" },
};
const FOLDERS: PageId[] = ["work", "about", "notes", "library"];

function AppIcon({ kind }: { kind: string }) {
  if (kind === "folder") return <span className={styles.folderShape} aria-hidden="true" />;
  return (
    <span className={`${styles.appIcon} ${styles[kind]}`} aria-hidden="true">
      {kind === "face" ? <svg viewBox="0 0 40 40" fill="none"><path d="M20 3v19h5l-3 15M10 12v5m20-5v5M10 26q10 8 20 0" /></svg> :
        kind === "notes" ? <span className={styles.noteLines} /> :
        kind === "grid" ? <span className={styles.gridIcon}>{[0, 1, 2, 3].map(i => <i key={i} />)}</span> : "✳"}
    </span>
  );
}

function PageContent({ id, open }: { id: PageId; open: (id: PageId) => void }) {
  if (id === "botanical") return <>
    <span className={styles.eyebrow}>SELECTED WORK / 001</span>
    <h2>Botanical studies</h2>
    <p>A familiar form, seen a little differently. An exploration of flowers, photographic negatives, and the space between the natural and the digital.</p>
    <dl className={styles.projectMeta}><div><dt>MEDIUM</dt><dd>Digital experiment</dd></div><div><dt>EXPLORATION</dt><dd>Image, type & motion</dd></div></dl>
    <div className={styles.projectImage}><Image src="/images/darwin-botanical.webp" alt="Blue and lavender carnations against a deep green background" fill sizes="720px" /></div>
    <p className={styles.caption}>Organic shapes. Unexpected color. A different perspective.</p>
    <button className={styles.textButton} onClick={() => open("work")}>← Back to selected work</button>
  </>;
  if (id === "work") return <>
    <span className={styles.eyebrow}>A FEW THINGS I’VE BEEN EXPLORING</span>
    <h2>Made of curiosity.</h2>
    <p>A small collection of visual experiments. Open something that catches your eye.</p>
    <button className={styles.projectCard} onClick={() => open("botanical")}>
      <div className={styles.projectImage}><Image src="/images/darwin-botanical.webp" alt="Botanical studies preview" fill sizes="720px" /></div>
      <span><strong>Botanical studies</strong><small>Image, type & motion</small><b aria-hidden="true">↗</b></span>
    </button>
    <Link className={styles.collectionLink} href="/">Explore the full collection <span aria-hidden="true">↗</span></Link>
  </>;
  if (id === "about") return <>
    <span className={styles.eyebrow}>A LITTLE INTRODUCTION</span>
    <div className={styles.aboutMark} aria-hidden="true">d.</div>
    <h2>A home for<br />curious ideas.</h2>
    <p>Darwin is a collection of playful interfaces, small interactions, and experiments in motion. A place to try things, turn them over, and see what happens.</p>
    <p>This desktop is an invitation to explore. Every folder opens a different corner of the collection.</p>
    <button className={styles.pillButton} onClick={() => open("work")}>Take a look around <span aria-hidden="true">↗</span></button>
  </>;
  if (id === "notes") return <>
    <span className={styles.eyebrow}>THOUGHTS FROM THE DESKTOP</span>
    <h2>Field notes.</h2>
    <div className={styles.notesList}>
      <article><span>01 / INTERACTION</span><h3>Make room for discovery.</h3><p>A folder is a small promise: there’s something inside. Familiar gestures can make an unfamiliar place feel like home.</p></article>
      <article><span>02 / MOTION</span><h3>A little movement goes a long way.</h3><p>Use motion to explain where something came from and where it went. Let the content have the last word.</p></article>
      <article><span>03 / PROCESS</span><h3>Leave a little room to play.</h3><p>Some ideas start with a plan. Others start with a color, a shape, or a happy accident. Both are worth following.</p></article>
    </div>
  </>;
  return <>
    <span className={styles.eyebrow}>THE GOOD STUFF, ALL IN ONE PLACE</span>
    <h2>The library.</h2>
    <p>Open a collection to explore the experiments, see the code, and make something of your own.</p>
    <div className={styles.libraryLinks}>
      {[['/text', '01', 'Type & lettering', 'Words with a little personality.'], ['/scroll', '02', 'Scroll experiments', 'Stories that move with you.'], ['/carousel', '03', 'Carousels', 'A different way to look around.'], ['/intro', '04', 'First impressions', 'Make an entrance.']].map(([href, number, title, description]) => <Link href={href} key={href}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><b aria-hidden="true">↗</b></Link>)}
    </div>
  </>;
}

export function MacDesktopHero() {
  const host = useRef<HTMLElement>(null);
  const flow = useRef<HTMLCanvasElement>(null);
  const windowRefs = useRef(new Map<PageId, HTMLDivElement>());
  const launchers = useRef(new Map<PageId, HTMLButtonElement>());
  const drag = useRef<{ id: PageId; pointer: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [clock, setClock] = useState("09:41");
  const active = windows.findLast(window => !window.minimized)?.id;

  useEffect(() => {
    if (flow.current) return createDesktopFlow(flow.current);
  }, []);

  function clampPosition(x: number, y: number) {
    const width = host.current?.clientWidth ?? 944;
    const height = host.current?.clientHeight ?? 700;
    const windowWidth = Math.min(720, width - 32);
    const windowHeight = Math.min(510, height - 136);
    return { x: Math.max(16, Math.min(width - windowWidth - 16, x)), y: Math.max(46, Math.min(height - windowHeight - 82, y)) };
  }

  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update();
    const interval = setInterval(update, 60000);
    const observer = new ResizeObserver(() => setWindows(current => current.map(window => ({ ...window, ...clampPosition(window.x, window.y) }))));
    if (host.current) observer.observe(host.current);
    return () => { clearInterval(interval); observer.disconnect(); };
  }, []);

  function focusWindow(id: PageId) {
    setWindows(current => {
      const index = current.findIndex(window => window.id === id);
      if (index < 0 || index === current.length - 1) return current;
      return [...current.slice(0, index), ...current.slice(index + 1), current[index]];
    });
  }

  function open(id: PageId) {
    setWindows(current => {
      const existing = current.find(window => window.id === id);
      const width = host.current?.clientWidth ?? 944;
      const position = clampPosition((width - Math.min(720, width - 32)) / 2 + current.length * 16, 68 + current.length * 18);
      return [...current.filter(window => window.id !== id), existing ? { ...existing, minimized: false } : { id, ...position, minimized: false, maximized: false }];
    });
    requestAnimationFrame(() => windowRefs.current.get(id)?.focus({ preventScroll: true }));
  }

  function dismiss(id: PageId, minimize = false) {
    setWindows(current => minimize ? current.map(window => window.id === id ? { ...window, minimized: true } : window) : current.filter(window => window.id !== id));
    launchers.current.get(id)?.focus({ preventScroll: true });
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, window: DesktopWindow) {
    if (window.maximized || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    drag.current = { id: window.id, pointer: event.pointerId, x: window.x, y: window.y, startX: event.clientX, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const position = clampPosition(start.x + event.clientX - start.startX, start.y + event.clientY - start.startY);
    setWindows(current => current.map(window => window.id === start.id ? { ...window, ...position } : window));
  }

  return (
    <section ref={host} className={styles.desktop} aria-label="Mac desktop hero">
      <div className={styles.wallpaper} aria-hidden="true"><canvas ref={flow} className={styles.flowCanvas} /></div>
      <nav className={styles.menuBar} aria-label="Desktop menu">
        <button className={styles.brand} onClick={() => open("about")} aria-label="About Darwin">d.</button>
        <strong>Darwin</strong>
        <button onClick={() => open("work")}>Work</button>
        <button onClick={() => setWindows(current => current.map(window => ({ ...window, minimized: true })))}>Desktop</button>
        <span className={styles.menuRight}><span className={styles.status} aria-hidden="true">◉ <span className={styles.battery} /></span><time>{clock}</time></span>
      </nav>
      <div className={styles.desktopIntro}><span>AN INDEPENDENT SPACE FOR IDEAS</span><h1>Make yourself<br /><em>at home.</em></h1><p>A few projects, a few thoughts.<br />Open a folder. Stay a little.</p></div>
      <button className={styles.photoFile} ref={node => { if (node) launchers.current.set("botanical", node); }} onClick={() => open("botanical")} aria-label="Open Botanical studies">
        <span><Image src="/images/darwin-botanical.webp" alt="" fill sizes="100px" /></span><b>Botanical studies</b><small>an ongoing exploration</small>
      </button>
      <div className={styles.folders} aria-label="Desktop folders">
        {FOLDERS.map(id => <button key={id} ref={node => { if (node) launchers.current.set(id, node); }} onClick={() => open(id)} aria-label={`Open ${PAGES[id].title}`}><AppIcon kind="folder" /><span>{PAGES[id].title}</span></button>)}
      </div>
      <span className={styles.desktopFootnote}>A WORK IN PROGRESS, ALWAYS.</span>
      {windows.map((window, index) => <div
        key={window.id}
        ref={node => { if (node) windowRefs.current.set(window.id, node); else windowRefs.current.delete(window.id); }}
        role="dialog"
        aria-label={PAGES[window.id].title}
        tabIndex={-1}
        hidden={window.minimized}
        data-active={active === window.id}
        data-maximized={window.maximized}
        className={styles.window}
        style={{ left: window.x, top: window.y, zIndex: 10 + index }}
        onPointerDown={() => focusWindow(window.id)}
        onFocus={() => focusWindow(window.id)}
        onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); dismiss(window.id); } }}
      >
        <header className={styles.titlebar} onPointerDown={event => startDrag(event, window)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
          <div className={styles.trafficLights}>
            <button className={styles.close} aria-label={`Close ${PAGES[window.id].title}`} onClick={() => dismiss(window.id)}><span>×</span></button>
            <button className={styles.minimize} aria-label={`Minimize ${PAGES[window.id].title}`} onClick={() => dismiss(window.id, true)}><span>−</span></button>
            <button className={styles.maximize} aria-label={`${window.maximized ? "Restore" : "Maximize"} ${PAGES[window.id].title}`} onClick={() => setWindows(current => current.map(item => item.id === window.id ? { ...item, maximized: !item.maximized } : item))}><span>↗</span></button>
          </div>
          <span className={styles.windowTitle} tabIndex={0} aria-label={`${PAGES[window.id].title}. Use arrow keys to move window.`} onKeyDown={event => {
            if (window.maximized || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            const position = clampPosition(window.x + (event.key === "ArrowRight" ? 16 : event.key === "ArrowLeft" ? -16 : 0), window.y + (event.key === "ArrowDown" ? 16 : event.key === "ArrowUp" ? -16 : 0));
            setWindows(current => current.map(item => item.id === window.id ? { ...item, ...position } : item));
          }}>{PAGES[window.id].title}</span>
          <span className={styles.titlebarEnd} aria-hidden="true">↗</span>
        </header>
        <div className={`${styles.windowContent} ${window.id === "notes" ? styles.notesPaper : ""}`}><PageContent id={window.id} open={open} /></div>
        <footer className={styles.windowFooter}><span>DARWIN / {PAGES[window.id].label.toUpperCase()}</span><span>Made to be explored.</span></footer>
      </div>)}
      <nav className={styles.dock} aria-label="Application dock">
        {FOLDERS.map(id => <button key={id} className={styles.dockItem} onClick={() => open(id)} aria-label={`Open ${PAGES[id].title} from dock`} data-running={windows.some(window => window.id === id)}><span className={styles.tooltip}>{PAGES[id].title}</span><AppIcon kind={PAGES[id].icon} /><i /></button>)}
        <span className={styles.dockDivider} />
        <button className={styles.dockItem} aria-label="Show desktop" onClick={() => setWindows(current => current.map(window => ({ ...window, minimized: true })))}><span className={styles.tooltip}>Show desktop</span><span className={styles.desktopIcon} aria-hidden="true"><i /></span></button>
      </nav>
    </section>
  );
}
