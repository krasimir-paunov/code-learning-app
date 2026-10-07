import { Check, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { LayoutChooserProps } from './build.ts';
import { verdict, type Layout } from './model.ts';
import styles from './View.module.css';
import { useElementWidth } from '../../components/use-element-width.ts';

const PAGE_CSS = `
  :host { color: #1f2937; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  .viewport { padding: 12px; background: #eef1f5; font: 14px/1.4 system-ui, sans-serif; }
`;

export default function LayoutChooserView({ props }: VisualizerViewProps<LayoutChooserProps>) {
  const [index, setIndex] = useState('0');
  const [layout, setLayout] = useState<Layout>('flex');
  const [width, setWidth] = useState(props.width.start);
  const [areaRef, available] = useElementWidth();
  const scenario = props.scenarios[Number(index)] ?? props.scenarios[0];
  if (!scenario) return null;

  const max = Math.max(
    props.width.min,
    Math.min(props.width.max, (available ?? props.width.max) - 30),
  );
  const shown = Math.min(width, max);
  const result = verdict(scenario, layout);
  const rule = layout === 'flex' ? scenario.flex : scenario.grid;

  return (
    <div className={styles.frame}>
      <SegmentedControl
        label="The job"
        size="sm"
        options={props.scenarios.map((s, i) => ({ value: String(i), label: s.name }))}
        value={index}
        onChange={(value) => {
          setIndex(value);
          setLayout('flex');
        }}
      />
      <SegmentedControl<Layout>
        label="Lay it out with"
        options={[
          { value: 'flex', label: 'Flexbox' },
          { value: 'grid', label: 'Grid' },
        ]}
        value={layout}
        onChange={setLayout}
      />
      <Slider
        label="Available width"
        min={props.width.min}
        max={max}
        step={10}
        value={shown}
        onChange={setWidth}
        format={(v) => `${v}px`}
      />
      <div ref={areaRef} className={styles.area}>
        <ShadowStage
          html={`<div class="viewport">${scenario.html}</div>`}
          css={`${PAGE_CSS}\n.viewport { width: ${shown}px; }\n${scenario.base}\n${rule}`}
          className={styles.stage}
          inert
        />
      </div>
      <div className={styles.verdict} data-fits={result.fits || undefined} aria-live="polite">
        {result.fits ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
        <p>
          <strong>{result.fits ? 'A good fit. ' : 'It works, but… '}</strong>
          {result.text}
        </p>
      </div>
      <pre className={styles.code}>
        <code>{rule.trim()}</code>
      </pre>
    </div>
  );
}
