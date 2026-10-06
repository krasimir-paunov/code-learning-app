import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import styles from './FlexDemo.module.css';

const JUSTIFY = ['flex-start', 'center', 'space-between', 'space-evenly'] as const;
type Justify = (typeof JUSTIFY)[number];

/** A tiny taste of a playground: real CSS, applied live. */
export function FlexDemo() {
  const [justify, setJustify] = useState<Justify>('flex-start');
  const [gap, setGap] = useState(8);

  return (
    <div className={styles.demo}>
      <div className={styles.controls}>
        <SegmentedControl
          label="justify-content"
          size="sm"
          options={JUSTIFY.map((value) => ({ value, label: value }))}
          value={justify}
          onChange={setJustify}
        />
        <Slider
          label="gap"
          min={0}
          max={32}
          value={gap}
          onChange={setGap}
          format={(v) => `${v}px`}
        />
      </div>
      <div className={styles.stage} style={{ justifyContent: justify, gap }}>
        {[1, 2, 3].map((n) => (
          <div key={n} className={styles.item}>
            {n}
          </div>
        ))}
      </div>
      <pre className={styles.code}>
        <code>
          {`.row {\n  display: flex;\n  justify-content: ${justify};\n  gap: ${gap}px;\n}`}
        </code>
      </pre>
    </div>
  );
}
