import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Slider } from '../../../../components/Slider.tsx';
import { Toggle } from '../../../../components/Toggle.tsx';
import { CodeEditor } from '../../../../components/code-editor/CodeEditor.tsx';
import { mountSandbox } from '../../../runners/web-sandbox/index.ts';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import styles from '../../shared/challenge.module.css';
import type { VisualMatchAnswer, VisualMatchSpec } from './index.ts';
import local from './View.module.css';
import { useElementWidth } from '../../../../components/use-element-width.ts';

const PREVIEW_DELAY_MS = 400;
/** Wider pages get the full width under the editor instead of a column beside it. */
const WIDE_VIEWPORT = 400;

/** A live, isolated render of the challenge HTML with the given CSS. */
function Preview({
  spec,
  css,
  title,
  className,
}: {
  spec: VisualMatchSpec;
  css: string;
  title: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let handle: ReturnType<typeof mountSandbox> | undefined;
    const timer = setTimeout(() => {
      handle = mountSandbox(
        element,
        { files: { 'index.html': spec.html, 'style.css': css }, viewport: spec.viewport },
        { title, className: local.frame },
      );
    }, PREVIEW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      handle?.dispose();
    };
  }, [spec, css, title]);
  return (
    <div
      ref={host}
      className={className}
      style={{ inlineSize: spec.viewport.width, blockSize: spec.viewport.height }}
    />
  );
}

/**
 * The page at its exact grading size, scaled down (never up) to fit narrow screens. Grading runs
 * in its own sandbox at full size, so the scale only changes what the learner sees.
 */
function Stage({
  spec,
  scale,
  children,
}: {
  spec: VisualMatchSpec;
  scale: number;
  children: ReactNode;
}) {
  const { width, height } = spec.viewport;
  return (
    <div className={local.stage} style={{ inlineSize: width * scale, blockSize: height * scale }}>
      <div
        className={local.scaler}
        style={{ inlineSize: width, blockSize: height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export default function VisualMatchView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<VisualMatchSpec, VisualMatchAnswer>) {
  const [css, setCss] = useState(spec.starterCss);
  const [overlay, setOverlay] = useState(false);
  const [opacity, setOpacity] = useState(50);
  const failing = (state.lastResult?.details ?? []).filter((d) => !d.passed);
  const [previewsRef, available] = useElementWidth();
  const scale = available ? Math.min(1, available / spec.viewport.width) : 1;
  const scaled = scale < 1 ? ` (shown at ${Math.round(scale * 100)}%)` : '';

  return (
    <div className={styles.stack}>
      <div className={local.layout} data-wide={spec.viewport.width > WIDE_VIEWPORT || undefined}>
        <div className={styles.stack}>
          <CodeEditor
            value={css}
            onChange={setCss}
            language="css"
            label="style.css editor"
            readOnly={disabled}
          />
          <details className={local.html}>
            <summary>HTML (read only)</summary>
            <pre>
              <code>{spec.html}</code>
            </pre>
          </details>
        </div>
        <div className={styles.stack}>
          <div ref={previewsRef} className={local.previews}>
            <figure className={local.figure}>
              <figcaption>
                Your result{overlay && ' with the target overlaid'}
                {scaled}
              </figcaption>
              <Stage spec={spec} scale={scale}>
                <Preview spec={spec} css={css} title="Your result" className={local.layer} />
                {overlay && (
                  <div
                    className={local.ghost}
                    style={{ opacity: opacity / 100 }}
                    aria-hidden="true"
                  >
                    <Preview
                      spec={spec}
                      css={spec.targetCss}
                      title="Target overlay"
                      className={local.layer}
                    />
                  </div>
                )}
              </Stage>
            </figure>
            {!overlay && (
              <figure className={local.figure}>
                <figcaption>
                  Target
                  {scaled}
                </figcaption>
                <Stage spec={spec} scale={scale}>
                  <Preview
                    spec={spec}
                    css={spec.targetCss}
                    title="Target design"
                    className={local.layer}
                  />
                </Stage>
              </figure>
            )}
          </div>
          <Toggle label="Overlay the target (ghost)" checked={overlay} onChange={setOverlay} />
          {overlay && (
            <Slider
              label="Ghost opacity"
              min={10}
              max={90}
              step={10}
              value={opacity}
              onChange={setOpacity}
              format={(v) => `${v}%`}
            />
          )}
        </div>
      </div>
      {failing.length > 0 && (
        <ul className={local.diffs} aria-label="Differences from the target">
          {failing.map((d) => (
            <li key={d.label}>
              <code>{d.label}</code> {d.message}
            </li>
          ))}
        </ul>
      )}
      <div>
        <CheckButton label="Compare with target" onCheck={() => submit(css)} disabled={disabled} />
      </div>
    </div>
  );
}
