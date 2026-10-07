import { Check, Minus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CodeEditor } from '../../components/code-editor/CodeEditor.tsx';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useElementWidth } from '../../components/use-element-width.ts';
import type { Measurement } from '../../engine/runners/contract.ts';
import { mountSandbox, webSandbox } from '../../engine/runners/web-sandbox/index.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { ResponsiveCheckerProps } from './build.ts';
import {
  measureFor,
  rendersFor,
  renderKey,
  runAll,
  withTheme,
  type Check as SpecCheck,
  type Theme,
} from './model.ts';
import styles from './View.module.css';

const DELAY_MS = 400;

/** The page at its real width in a sandboxed iframe, scaled down (never up) to fit. */
function Preview({
  html,
  css,
  width,
  height,
}: {
  html: string;
  css: string;
  width: number;
  height: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [fitRef, available] = useElementWidth();
  const scale = available ? Math.min(1, available / width) : 1;
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let handle: ReturnType<typeof mountSandbox> | undefined;
    const timer = setTimeout(() => {
      handle = mountSandbox(
        element,
        { files: { 'index.html': html, 'style.css': css }, viewport: { width, height } },
        { title: `The page at ${width}px` },
      );
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      handle?.dispose();
    };
  }, [html, css, width, height]);
  return (
    <figure className={styles.figure} ref={fitRef}>
      <figcaption>
        {width}px wide{scale < 1 && ` (shown at ${Math.round(scale * 100)}%)`}
      </figcaption>
      <div
        className={styles.stage}
        style={{ inlineSize: width * scale, blockSize: height * scale }}
      >
        <div
          ref={host}
          className={styles.scaler}
          style={{ inlineSize: width, blockSize: height, transform: `scale(${scale})` }}
        />
      </div>
    </figure>
  );
}

/** Measures the page off-screen at every width and theme the checks need. */
function useMeasurements(props: ResponsiveCheckerProps, css: string) {
  const [results, setResults] = useState(() => new Map<string, Record<string, Measurement>>());
  useEffect(() => {
    const controller = new AbortController();
    const checks: SpecCheck[] = props.checks;
    const measure = measureFor(checks);
    const timer = setTimeout(() => {
      void Promise.all(
        rendersFor(checks, props.widths).map(async (render) => {
          const run = await webSandbox.run(
            {
              files: { 'index.html': withTheme(props.html, render.theme), 'style.css': css },
              measure,
              viewport: { width: render.width, height: props.height },
            },
            controller.signal,
          );
          return [renderKey(render), run.measurements ?? {}] as const;
        }),
      ).then((entries) => {
        if (!controller.signal.aborted) setResults(new Map(entries));
      });
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [props, css]);
  return results;
}

export default function ResponsiveCheckerView({
  props,
}: VisualizerViewProps<ResponsiveCheckerProps>) {
  const id = useId();
  const [css, setCss] = useState(props.css);
  const [widthIndex, setWidthIndex] = useState('0');
  const [theme, setTheme] = useState<Theme>('light');
  const width = props.widths[Number(widthIndex)] ?? (props.widths[0] as number);
  const results = useMeasurements(props, css);
  const rows = runAll(props.checks, props.widths, results);
  const outcomes = rows.flatMap((row) => [...(row?.values() ?? [])]);
  const measured = rows.every(Boolean);
  const done = outcomes.filter((o) => o.pass).length;

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <div className={styles.editor}>
          <CodeEditor value={css} onChange={setCss} language="css" label="style.css editor" />
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={() => setCss(props.css)}>
              Start over
            </button>
            <details className={styles.solution}>
              <summary>One possible solution</summary>
              <pre>
                <code>{props.solution.trim()}</code>
              </pre>
            </details>
          </div>
        </div>
        <div className={styles.view}>
          <div className={styles.controls}>
            <SegmentedControl
              label="Page width"
              size="sm"
              options={props.widths.map((w, i) => ({ value: String(i), label: `${w}px` }))}
              value={widthIndex}
              onChange={setWidthIndex}
            />
            <SegmentedControl<Theme>
              label="Theme"
              size="sm"
              options={[
                { value: 'light', label: 'light' },
                { value: 'dark', label: 'dark' },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </div>
          <Preview
            html={withTheme(props.html, theme)}
            css={css}
            width={width}
            height={props.height}
          />
        </div>
      </div>

      <section className={styles.spec}>
        <h3 id={`${id}-spec`} className={styles.title}>
          The spec: {measured ? `${done} of ${outcomes.length} checks pass` : 'measuring…'}
        </h3>
        <div className={styles.scroll} role="region" aria-labelledby={`${id}-spec`} tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Check</th>
                {props.widths.map((w) => (
                  <th key={w} scope="col">
                    {w}px
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-live="polite">
              {props.checks.map((check, i) => (
                <tr key={check.label}>
                  <th scope="row">
                    {check.label}
                    {check.theme === 'dark' && <span className={styles.tag}>dark</span>}
                  </th>
                  {props.widths.map((w) => {
                    const outcome = rows[i]?.get(w);
                    if (!rows[i]?.has(w) && measured)
                      return (
                        <td key={w} className={styles.cell}>
                          <Minus aria-hidden="true" />
                          <span className="visually-hidden">not checked at this width</span>
                        </td>
                      );
                    return (
                      <td key={w} className={styles.cell} data-pass={outcome?.pass}>
                        {outcome?.pass === true && <Check aria-hidden="true" />}
                        {outcome?.pass === false && <X aria-hidden="true" />}
                        <span className={outcome?.pass ? 'visually-hidden' : styles.detail}>
                          {outcome
                            ? `${outcome.pass ? 'passes' : 'fails'}: ${outcome.detail}`
                            : '…'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {measured && done === outcomes.length && (
          <p className={styles.complete}>The page meets the spec at every width.</p>
        )}
      </section>
    </div>
  );
}
