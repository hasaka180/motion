"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  FONT_STACK,
  SLIDE_H,
  SLIDE_W,
  fontStack,
  resolvePaint,
  resolveText,
  textStyle,
  type Block,
  type Brand,
  type Slide,
  type TextBlock,
} from "./types";

/**
 * Draws one slide at its native 1600×900. Whoever renders it decides the
 * scale — the editor, the thumbnail strip and the print sheet all wrap this
 * in their own scaled box, so a slide looks identical everywhere it appears.
 */

type Props = {
  slide: Slide;
  brand: Brand;
  /** Editing chrome — empty-slot hints, drop targets — only in the editor. */
  editable?: boolean;
  editingId?: string | null;
  selection?: string[];
  onBlockPointerDown?: (e: ReactPointerEvent, block: Block) => void;
  onBlockDoubleClick?: (block: Block) => void;
  onTextCommit?: (id: string, text: string) => void;
  onImageDrop?: (id: string, files: FileList) => void;
  onImageClick?: (id: string) => void;
};

const box = (b: Block): CSSProperties => ({
  position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h,
});

export function SlideView({
  slide, brand, editable, editingId, selection = [],
  onBlockPointerDown, onBlockDoubleClick, onTextCommit, onImageDrop, onImageClick,
}: Props) {
  const swatchHex = (token: TextBlock["color"] | number) =>
    typeof token === "number" ? brand.extras[token]?.hex ?? "#ff00ff" : resolvePaint(token, brand);
  const swatchName = (token: TextBlock["color"] | number) =>
    typeof token === "number" ? brand.extras[token]?.name ?? "—" : token.startsWith("#") ? token : brand.palette[token as keyof Brand["palette"]].name;

  return (
    <div
      data-slide
      style={{
        position: "relative", width: SLIDE_W, height: SLIDE_H, overflow: "hidden",
        background: slide.gradient ?? resolvePaint(slide.bg, brand),
        fontFamily: fontStack(brand.type.body.face),
      }}
    >
      {editable && slide.reference?.visible && slide.reference.src && (
        // eslint-disable-next-line @next/next/no-img-element -- the traced reference, editor-only
        <img
          src={slide.reference.src}
          alt=""
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: slide.reference.opacity, pointerEvents: "none" }}
        />
      )}
      {slide.blocks.map((b) => {
        const common = {
          "data-block": b.id,
          onPointerDown: onBlockPointerDown ? (e: ReactPointerEvent) => onBlockPointerDown(e, b) : undefined,
          onDoubleClick: onBlockDoubleClick ? () => onBlockDoubleClick(b) : undefined,
        };

        if (b.kind === "rect") {
          return <div key={b.id} {...common} style={{ ...box(b), background: b.gradient ?? resolvePaint(b.fill, brand), borderRadius: b.radius }} />;
        }

        if (b.kind === "swatch") {
          const hex = swatchHex(b.token);
          const dark = luminance(hex) < .5;
          const fg = dark ? "#ffffff" : "#111111";
          return (
            <div key={b.id} {...common} style={{ ...box(b), background: hex, borderRadius: b.radius, color: fg, fontFamily: FONT_STACK.mono }}>
              {b.caption === "inside" && (
                <div style={{ position: "absolute", left: 18, top: 16, right: 18, bottom: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 20, fontWeight: 500, fontFamily: FONT_STACK.sans }}>{swatchName(b.token)}</div>
                  <div style={{ fontSize: 13, letterSpacing: ".06em", opacity: .85 }}>{hex.toUpperCase()}</div>
                </div>
              )}
              {b.caption === "below" && (
                <div style={{ position: "absolute", left: 0, top: "100%", paddingTop: 10, fontSize: 13, color: resolvePaint("ink", brand), letterSpacing: ".06em" }}>
                  {swatchName(b.token)} · {hex.toUpperCase()}
                </div>
              )}
            </div>
          );
        }

        if (b.kind === "logo") {
          return (
            <div key={b.id} {...common} style={{ ...box(b), display: "flex", alignItems: "center", justifyContent: "center", color: resolvePaint(b.color, brand) }}>
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded data URL drawn at slide scale
                <img src={brand.logo} alt="" draggable={false} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontFamily: fontStack(brand.type.h1.face), fontSize: b.size, fontWeight: Math.max(600, brand.type.h1.weight), letterSpacing: "-.03em", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {brand.name}
                </span>
              )}
            </div>
          );
        }

        if (b.kind === "image") {
          const tint = resolvePaint(b.tint, brand);
          return (
            <div
              key={b.id}
              {...common}
              onClick={editable && !b.src && onImageClick ? () => onImageClick(b.id) : undefined}
              onDragOver={editable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } : undefined}
              onDrop={editable && onImageDrop ? (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length) onImageDrop(b.id, e.dataTransfer.files); } : undefined}
              style={{
                ...box(b), overflow: "hidden", borderRadius: b.radius,
                background: b.src ? "transparent" : tint,
                cursor: editable && !b.src ? "copy" : undefined,
              }}
            >
              {b.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded data URL drawn at slide scale
                <img src={b.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: b.fit, display: "block" }} />
              ) : editable ? (
                <div style={{
                  position: "absolute", inset: 8, border: "2px dashed rgba(127,127,127,.55)", borderRadius: Math.max(0, b.radius - 8),
                  display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
                  fontFamily: FONT_STACK.mono, fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase",
                  color: luminance(tint) < .5 ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.6)",
                }}>
                  <span>{b.label}</span>
                  <span style={{ fontSize: 11, opacity: .7 }}>drop or click</span>
                </div>
              ) : null}
            </div>
          );
        }

        // text
        const editing = editingId === b.id;
        const justify = b.valign === "middle" ? "center" : b.valign === "bottom" ? "flex-end" : "flex-start";
        const ts = textStyle(b, brand);
        return (
          <div
            key={b.id}
            {...common}
            style={{
              ...box(b), display: "flex", flexDirection: "column", justifyContent: justify,
              fontFamily: fontStack(ts.face), fontSize: b.size, fontWeight: ts.weight,
              fontStyle: ts.italic ? "italic" : "normal", textTransform: ts.uppercase ? "uppercase" : "none",
              textAlign: b.align, lineHeight: b.lineHeight, letterSpacing: `${b.tracking}em`,
              color: resolvePaint(b.color, brand), whiteSpace: "pre-wrap", wordBreak: "break-word",
              cursor: editing ? "text" : undefined,
            }}
          >
            <div
              contentEditable={editing || undefined}
              suppressContentEditableWarning
              spellCheck={false}
              onBlur={editing && onTextCommit ? (e) => onTextCommit(b.id, e.currentTarget.innerText) : undefined}
              onPointerDown={editing ? (e) => e.stopPropagation() : undefined}
              style={{ outline: "none", minHeight: "1em" }}
            >
              {editing ? b.text : resolveText(b.text, brand)}
            </div>
          </div>
        );
      })}
      {editable && selection.length === 0 && slide.blocks.length === 0 && !slide.reference && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: FONT_STACK.mono, fontSize: 16, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(127,127,127,.6)" }}>
          Empty page — add a block or drop an image
        </div>
      )}
    </div>
  );
}

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return .5;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
