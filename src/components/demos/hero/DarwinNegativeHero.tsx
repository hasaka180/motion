"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { createNegativeTrail } from "./darwin-negative/trail";
import { createBotanicalReveal } from "./darwin-negative/reveal";
import styles from "./DarwinNegativeHero.module.css";

const COPY =
  "Welcome. You made it. Nothing particularly exciting happens here, but we felt like a welcome screen would make the whole thing look more professional. Click something, or don’t. Honestly, we’re just happy the page loaded.";
/** Keep whole-word wrapping, with a continuous index for the letter reveal. */
const WORDS = COPY.split(" ").map((word, i, words) => ({
  text: word,
  start: words.slice(0, i).join("").length,
}));

export function DarwinNegativeHero() {
  const host = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const pixels = useRef<HTMLCanvasElement>(null);
  const portal = useRef<HTMLCanvasElement>(null);
  const lettering = useRef<SVGSVGElement>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    if (!imageReady) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    document.fonts.ready.then(() => {
      const image = artwork.current?.querySelector("img");
      if (!cancelled && host.current && canvas.current && artwork.current && pixels.current && portal.current && lettering.current && image) {
        const stopTrail = createNegativeTrail(host.current, canvas.current, artwork.current);
        const stopReveal = createBotanicalReveal(host.current, artwork.current, image, pixels.current, portal.current, lettering.current);
        dispose = () => { stopTrail(); stopReveal(); };
      }
    });
    return () => { cancelled = true; dispose?.(); };
  }, [imageReady]);

  return (
    <section ref={host} className={styles.hero} aria-label="Darwin botanical negative hero">
      <div ref={artwork} className={styles.artwork}>
        <div className={styles.imageStage}>
          <Image
            src="/images/darwin-botanical.webp"
            alt=""
            fill
            sizes="(min-width: 1312px) 944px, (min-width: 1024px) calc(100vw - 368px), (min-width: 640px) calc(100vw - 80px), calc(100vw - 48px)"
            className={styles.flowers}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
          />
        </div>
        <canvas ref={pixels} className={styles.decoding} aria-hidden="true" />
        <canvas ref={portal} className={styles.portal} aria-hidden="true" />
      </div>
      <div className={styles.shade} />
      <h2 className={styles.wordmark} aria-label="Hello">
        <svg ref={lettering} viewBox="0 0 638 200" fill="none" aria-hidden="true" className={styles.writing}>
          <path
            data-vector
            d="M8.69531 166.605C36.2425 151.292 61.3441 131.6 89.8223 98.0818C109.207 75.2011 119.628 49.0751 120.125 31.0549C120.373 17.6558 113.839 7.49108 101.762 7.49108C88.363 7.49108 79.9263 17.6558 74.7153 40.9886C69.0081 66.6315 64.7898 96.0558 54.1198 190.408"
            stroke="white"
            strokeWidth="14.8883"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            opacity="0"
          />
          <path
            data-vector
            d="M55.1641 181.188C60.6268 133.168 81.4136 98.1012 107.964 98.1012C123.845 98.1012 133.938 110.756 131.072 128.87C129.459 139.54 127.589 150.458 125.41 163.114C122.87 178.994 130.13 191.401 152.124 191.401C184.199 191.401 219.191 173.577 237.099 145.969C243.2 136.563 245.682 128.126 245.93 119.937C246.178 105.049 237.741 93.8828 222.853 93.8828C203.994 93.8828 189.602 115.223 189.602 142.518C189.602 171.798 205.483 192.394 239.21 192.394C285.067 192.394 335.861 137.345 359.2 75.9118C365.79 58.5662 368.262 42.4598 368.262 31.2044C368.262 17.8589 364.044 7.61145 352.133 7.61145C340.471 7.61145 332.778 16.6673 325.83 30.9661C317.69 47.5499 311.669 71.4694 309.205 98.5081C303.002 166.354 316.897 191.401 349.938 191.401C390.001 191.401 434.544 135.588 457.287 75.7218C463.805 58.5662 466.277 42.4598 466.277 31.2044C466.277 17.8589 462.059 7.61145 450.148 7.61145C438.486 7.61145 430.793 16.6673 423.845 30.9661C415.705 47.5499 409.683 71.4694 407.22 98.5081C401.017 166.354 414.912 191.401 444.418 191.401C473.876 191.401 489.879 165.723 499.473 138.456C508.957 111.501 520.62 94.8754 544.937 94.8754C565.036 94.8754 580.917 109.764 580.917 137.803C580.917 168.821 560.793 192.146 535.364 192.394C512.985 192.642 498.287 174.528 499.776 147.233C501.513 116.96 519.875 94.8754 543.945 94.8754C557.84 94.8754 569.512 101.052 578.684 107.779C603.551 125.919 622.711 114.709 630.049 96.7719"
            stroke="white"
            strokeWidth="14.8883"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            opacity="0"
          />
        </svg>
      </h2>
      <div className={styles.welcome} aria-live="polite">
        <div className={styles.welcomeInner}>
          <p className={styles.welcomeCopy}>
            <span className={styles.srOnly}>{COPY}</span>
            <span aria-hidden="true">
              {WORDS.map((word, i) => (
                <Fragment key={i}>
                  <span className={styles.word}>
                    {Array.from(word.text).map((letter, j) => (
                      <span
                        key={j}
                        className={styles.letter}
                        data-letter={letter}
                        style={{ "--letter-index": word.start + j } as CSSProperties}
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                  {i < WORDS.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>
          </p>
        </div>
      </div>
      <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
    </section>
  );
}
