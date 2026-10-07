import { useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { mountSandbox } from '../../engine/runners/web-sandbox/index.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { PositionLabProps } from './build.ts';
import { containingBlock, keepsSpace, type Ancestor, type Position } from './model.ts';
import styles from './View.module.css';

const POSITIONS: readonly Position[] = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
const REMOUNT_DELAY_MS = 150;

const OUTLINE = 'outline: 3px dashed #c2410c; outline-offset: -3px;';

/** The page in a real iframe, so fixed and sticky behave against a real viewport. */
function Page({ html, css, height }: { html: string; css: string; height: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let handle: ReturnType<typeof mountSandbox> | undefined;
    const timer = setTimeout(() => {
      handle = mountSandbox(
        element,
        { files: { 'index.html': html, 'style.css': css } },
        { title: 'The page' },
      );
    }, REMOUNT_DELAY_MS);
    return () => {
      clearTimeout(timer);
      handle?.dispose();
    };
  }, [html, css]);
  return <div ref={host} className={styles.page} style={{ blockSize: height }} />;
}

export default function PositionLabView({ props }: VisualizerViewProps<PositionLabProps>) {
  const [position, setPosition] = useState<Position>('static');
  const [relative, setRelative] = useState<Set<string>>(() => new Set());
  const [transformed, setTransformed] = useState<string | null>(null);

  const ancestors: Ancestor[] = props.ancestors.map((a) => ({
    id: a.id,
    position: relative.has(a.id) ? 'relative' : 'static',
    transformed: transformed === a.id,
  }));
  const cb = containingBlock(position, ancestors);
  const selectorOf = (id: string) => props.ancestors.find((a) => a.id === id)?.selector ?? '';

  const highlight =
    cb.kind === 'ancestor'
      ? `${selectorOf(cb.id)} { ${OUTLINE} }`
      : cb.kind === 'page'
        ? `html { ${OUTLINE} }`
        : cb.kind === 'viewport'
          ? `body::after { content: ""; position: fixed; inset: 0; ${OUTLINE} pointer-events: none; }`
          : '';
  const css = [
    'body { margin: 0; font: 15px/1.5 system-ui, sans-serif; color: #1f2937; background: #fff; }',
    props.css,
    ...props.ancestors
      .filter((a) => relative.has(a.id))
      .map((a) => `${a.selector} { position: relative; }`),
    transformed ? `${selectorOf(transformed)} { transform: translateZ(0); }` : '',
    `${props.target} { position: ${position}; ${props.offsets} }`,
    highlight,
  ].join('\n');

  const where =
    cb.kind === 'flow'
      ? position === 'static'
        ? 'Offsets do nothing: a static element just sits in the flow.'
        : position === 'relative'
          ? 'Offsets shift it from its own normal spot; the space it left stays reserved.'
          : 'It scrolls normally until it reaches its offset, then sticks inside its scrolling box.'
      : cb.kind === 'ancestor'
        ? `Offsets are measured from ${selectorOf(cb.id)}, outlined.`
        : cb.kind === 'page'
          ? 'No positioned ancestor, so offsets are measured from the page itself (outlined), and it scrolls away with it.'
          : 'Offsets are measured from the viewport (outlined): it stays put while the page scrolls.';

  return (
    <div className={styles.frame}>
      <SegmentedControl<Position>
        label={`position on ${props.target}`}
        size="sm"
        options={POSITIONS.map((p) => ({ value: p, label: p }))}
        value={position}
        onChange={setPosition}
      />
      <fieldset className={styles.ancestors}>
        <legend>Ancestors</legend>
        {props.ancestors.map((a) => (
          <label key={a.id} className={styles.check}>
            <input
              type="checkbox"
              checked={relative.has(a.id)}
              onChange={(e) =>
                setRelative((s) => {
                  const next = new Set(s);
                  if (e.target.checked) next.add(a.id);
                  else next.delete(a.id);
                  return next;
                })
              }
            />
            <code>
              {a.selector} {'{'} position: relative; {'}'}
            </code>
          </label>
        ))}
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={transformed !== null}
            onChange={(e) =>
              setTransformed(e.target.checked ? (props.ancestors[0]?.id ?? null) : null)
            }
          />
          <code>
            {props.ancestors[0]?.selector} {'{'} transform: translateZ(0); {'}'}
          </code>
        </label>
      </fieldset>

      <Page html={props.html} css={css} height={props.height} />
      <p className={styles.hint}>Scroll inside the page to see what moves.</p>

      <div className={styles.report} aria-live="polite">
        <p>
          <code>
            {props.target} {'{'} position: {position}; {props.offsets} {'}'}
          </code>
        </p>
        <p>{where}</p>
        <p className={styles.space}>
          {keepsSpace(position)
            ? 'It still takes up its space in the flow.'
            : 'It is out of the flow: the content around it closes up as if it weren’t there.'}
        </p>
      </div>
    </div>
  );
}
