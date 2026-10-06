import { useEffect, useRef, useState } from 'react';
import { Slider } from '../../../../components/Slider.tsx';
import { Toggle } from '../../../../components/Toggle.tsx';
import { CodeEditor } from '../../../../components/code-editor/CodeEditor.tsx';
import { mountSandbox } from '../../../runners/web-sandbox/index.ts';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import styles from '../../shared/challenge.module.css';
import type { VisualMatchAnswer, VisualMatchSpec } from './index.ts';
import local from './View.module.css';

const PREVIEW_DELAY_MS = 400;

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

  return (
    <div className={styles.stack}>
      <div className={local.layout}>
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
          <div className={local.previews}>
            <figure className={local.figure}>
              <figcaption>Your result{overlay && ' with the target overlaid'}</figcaption>
              <div
                className={local.stage}
                style={{ inlineSize: spec.viewport.width, blockSize: spec.viewport.height }}
              >
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
              </div>
            </figure>
            {!overlay && (
              <figure className={local.figure}>
                <figcaption>Target</figcaption>
                <div
                  className={local.stage}
                  style={{ inlineSize: spec.viewport.width, blockSize: spec.viewport.height }}
                >
                  <Preview
                    spec={spec}
                    css={spec.targetCss}
                    title="Target design"
                    className={local.layer}
                  />
                </div>
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
