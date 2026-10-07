import { useId, useState } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SurfaceStudioProps } from './build.ts';
import {
  borderWidth,
  cardDeclarations,
  LAYERS,
  layerDeclarations,
  toCss,
  type Enabled,
  type Layer,
  type Surface,
} from './model.ts';
import styles from './View.module.css';

/** Pages render on a plain light canvas, so shadows read the way they do on most sites. */
const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  .page { display: grid; place-items: center; min-height: 296px; box-sizing: border-box; padding: 28px 16px; background: #eef1f5; }
  .card { box-sizing: border-box; width: min(100%, 240px); padding: 16px; }
  .card h3 { margin: 0 0 4px; font: 700 18px/1.3 system-ui, sans-serif; }
  .card p { margin: 0; font: 14px/1.5 system-ui, sans-serif; }
  .stack { position: relative; width: 200px; height: 130px; margin: 76px auto 30px;
    transform: rotateX(55deg) rotateZ(-35deg); transform-style: preserve-3d; }
  .layer { position: absolute; inset: 0; box-sizing: border-box; }
  .content { padding: 14px; font: 700 15px/1.3 system-ui, sans-serif; }
`;

const ESCAPE = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export default function SurfaceStudioView({ props }: VisualizerViewProps<SurfaceStudioProps>) {
  const id = useId();
  const [surface, setSurface] = useState<Surface>(() => ({
    'border-radius': props.options['border-radius'][0] ?? '0',
    'box-shadow': props.options['box-shadow'][0] ?? 'none',
    'background-color': props.options['background-color'][0] ?? 'transparent',
    'background-image': props.options['background-image'][0] ?? 'none',
    border: props.options.border[0] ?? 'none',
  }));
  const [enabled, setEnabled] = useState<Enabled>({
    'box-shadow': true,
    'background-color': true,
    'background-image': true,
    border: true,
  });

  const card = `<div class="page"><div class="card"><h3>${ESCAPE(props.title)}</h3><p>${ESCAPE(props.text)}</p></div></div>`;
  const cardCss = `${PAGE_CSS} .card { ${toCss(cardDeclarations(surface, enabled))} }`;

  const visible = LAYERS.filter((layer) => enabled[layer]);
  const exploded = `<div class="page"><div class="stack">${visible
    .map((layer) => `<div class="layer" data-layer="${layer}"></div>`)
    .join('')}<div class="layer content">${ESCAPE(props.title)}</div></div></div>`;
  const explodedCss = [
    PAGE_CSS,
    ...visible.map(
      (layer, i) =>
        `[data-layer="${layer}"] { ${toCss(layerDeclarations(layer, surface))} transform: translateZ(${i * 34}px); }`,
    ),
    `.content { transform: translateZ(${visible.length * 34}px); border: ${borderWidth(surface)} solid transparent; }`,
  ].join('\n');

  // Rows read top to bottom, the way the layers stack.
  const rows: Layer[] = [...LAYERS].reverse();
  const select = (property: keyof Surface, label: string) => (
    <select
      className={styles.select}
      aria-label={label}
      value={surface[property]}
      onChange={(e) => setSurface((s) => ({ ...s, [property]: e.target.value }))}
    >
      {props.options[property].map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  return (
    <div className={styles.frame}>
      <div className={styles.layout}>
        <figure className={styles.figure}>
          <figcaption className={styles.caption}>The card</figcaption>
          <ShadowStage html={card} css={cardCss} className={styles.stage} inert />
        </figure>
        <figure className={styles.figure}>
          <figcaption className={styles.caption}>The same card, layers pulled apart</figcaption>
          <ShadowStage html={exploded} css={explodedCss} className={styles.stage} inert />
        </figure>
      </div>

      <fieldset className={styles.rule} aria-labelledby={`${id}-rule`}>
        <legend id={`${id}-rule`} className={styles.selector}>
          <code>.card {'{'}</code> <span className={styles.hint}>top layer first</span>
        </legend>
        <div className={styles.row}>
          <span className={styles.fixed} aria-hidden="true" />
          <code className={styles.name}>content</code>
          <span className={styles.note}>text and children, always on top</span>
        </div>
        {rows.map((layer) => (
          <div key={layer} className={styles.row} data-off={!enabled[layer] || undefined}>
            <input
              type="checkbox"
              checked={enabled[layer]}
              aria-label={`Use ${layer}`}
              onChange={(e) => setEnabled((s) => ({ ...s, [layer]: e.target.checked }))}
            />
            <code className={styles.name}>{layer}:</code>
            {select(layer, layer)}
          </div>
        ))}
        <div className={styles.row}>
          <span className={styles.fixed} aria-hidden="true" />
          <code className={styles.name}>border-radius:</code>
          {select('border-radius', 'border-radius')}
        </div>
        <code aria-hidden="true">{'}'}</code>
      </fieldset>
    </div>
  );
}
