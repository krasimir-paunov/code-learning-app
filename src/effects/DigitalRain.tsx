import { useEffect, useRef } from 'react';
import styles from './DigitalRain.module.css';
import { useMotionPreference } from './motion.ts';
import { createRain, staticRain, stepRain, type RainGlyph } from './rain.ts';

const CELL = 18;
/** Ambient effects cap at 30 fps (DESIGN §4). */
const FRAME_MS = 1000 / 30;

interface DigitalRainProps {
  /** Learner pressed pause (WCAG 2.2.2: autoplay longer than 5 s must be pausable). */
  paused: boolean;
}

function readColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Landing-only background. Animates only with full effects, while on screen and while the
 * tab is visible; otherwise draws one static frame. Colors come from semantic tokens.
 */
export function DigitalRain({ paused }: DigitalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const level = useMotionPreference();
  const animate = level === 'full' && !paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const random = Math.random;
    const glyphColor = readColor('--neon-green');
    const bgColor = readColor('--bg-0');
    const fontFamily = readColor('--font-mono');
    let columns = 0;
    let rows = 0;
    let state = createRain(0, 0, random);
    let frame = 0;
    let last = 0;
    let onScreen = true;

    function drawGlyphs(context: CanvasRenderingContext2D, glyphs: RainGlyph[]) {
      context.fillStyle = glyphColor;
      for (const glyph of glyphs) {
        context.fillText(glyph.char, glyph.column * CELL + CELL / 2, glyph.row * CELL + CELL);
      }
    }

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `15px ${fontFamily}`;
      ctx.textAlign = 'center';
      columns = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      state = createRain(columns, rows, random);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      if (!animate) drawGlyphs(ctx, staticRain(columns, rows, random));
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (!ctx || !canvas || !onScreen || document.hidden || now - last < FRAME_MS) return;
      last = now;
      const { width, height } = canvas.getBoundingClientRect();
      // Translucent wash leaves fading trails behind each column head.
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      drawGlyphs(ctx, stepRain(state, rows, random));
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
    });
    intersection.observe(canvas);
    if (animate) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, [animate]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
