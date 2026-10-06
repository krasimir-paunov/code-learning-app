import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Base styles inside every stage: `all: initial` drops everything the app's CSS would pass in,
 * so examples start from the browser defaults. Only text and link colors come from the theme
 * (custom properties still inherit), to stay readable on the dark surface.
 */
const BASE_CSS = `:host { all: initial; display: block; color: var(--text-1); font-family: var(--font-body); font-size: 16px; line-height: 1.5; }
a { color: var(--accent); }`;

interface ShadowStageProps {
  /**
   * Author content from lesson data. Never learner-typed: it is inserted into the live page
   * (learner HTML belongs in the sandboxed iframe).
   */
  html: string;
  /** May be learner-typed: CSS cannot run script, and the app's CSP blocks external loads. */
  css?: string;
  /** Called after each render with the shadow root, for measuring or wiring events. */
  onRender?: (root: ShadowRoot) => void;
  className?: string;
  style?: CSSProperties;
  label?: string;
  /** A picture of the page, not a working one: links and form submits do nothing. */
  inert?: boolean;
}

/**
 * Renders a small page in a shadow root: its CSS cannot leak into the app and the app's CSS
 * cannot leak in, so lesson examples behave like a fresh document.
 */
export function ShadowStage({
  html,
  css = '',
  onRender,
  className,
  style,
  label,
  inert = false,
}: ShadowStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const base = document.createElement('style');
    base.textContent = BASE_CSS;
    const authored = document.createElement('style');
    const content = document.createElement('div');
    content.setAttribute('part', 'content');
    shadow.replaceChildren(base, authored, content);
    styleRef.current = authored;
    contentRef.current = content;
    setRoot(shadow);
    if (!inert) return;
    const stop = (event: Event) => event.preventDefault();
    shadow.addEventListener('click', stop);
    shadow.addEventListener('submit', stop);
    return () => {
      shadow.removeEventListener('click', stop);
      shadow.removeEventListener('submit', stop);
    };
  }, [inert]);

  useLayoutEffect(() => {
    if (!root || !contentRef.current) return;
    contentRef.current.innerHTML = html;
  }, [root, html]);

  useLayoutEffect(() => {
    if (styleRef.current) styleRef.current.textContent = css;
  }, [root, css]);

  useLayoutEffect(() => {
    if (root) onRender?.(root);
  });

  return (
    <div
      ref={hostRef}
      className={className}
      style={style}
      role={label ? 'region' : undefined}
      aria-label={label}
    />
  );
}
