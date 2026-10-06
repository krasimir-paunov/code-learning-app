import { useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Slider } from '../../components/Slider.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { BoxInspectorProps } from './build.ts';
import { cssFor, layoutBox, type BoxInput, type BoxSizing } from './model.ts';
import styles from './View.module.css';

const CONTENT_HEIGHT = 24;

/** Scale the diagram down to fit narrow screens (px numbers stay exact in the labels). */
function useFitScale(width: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(width);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(entry?.contentRect.width ?? width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return { ref, scale: Math.min(1, available / width) };
}

export default function BoxInspectorView({ props }: VisualizerViewProps<BoxInspectorProps>) {
  const [input, setInput] = useState<BoxInput>({
    width: props.width.default,
    padding: props.padding.default,
    border: props.border.default,
    margin: props.margin.default,
    boxSizing: props.boxSizing,
    contentHeight: CONTENT_HEIGHT,
  });
  const box = layoutBox(input);
  const { ref, scale } = useFitScale(box.marginBox.width);
  const set = (key: keyof BoxInput) => (value: number) => setInput((i) => ({ ...i, [key]: value }));

  return (
    <div className={styles.inspector}>
      <div className={styles.controls}>
        <Slider
          label="width"
          min={props.width.min}
          max={props.width.max}
          value={input.width}
          onChange={set('width')}
          format={(v) => `${v}px`}
        />
        <Slider
          label="padding"
          min={props.padding.min}
          max={props.padding.max}
          value={input.padding}
          onChange={set('padding')}
          format={(v) => `${v}px`}
        />
        <Slider
          label="border"
          min={props.border.min}
          max={props.border.max}
          value={input.border}
          onChange={set('border')}
          format={(v) => `${v}px`}
        />
        <Slider
          label="margin"
          min={props.margin.min}
          max={props.margin.max}
          value={input.margin}
          onChange={set('margin')}
          format={(v) => `${v}px`}
        />
        {props.allowBoxSizing && (
          <SegmentedControl<BoxSizing>
            label="box-sizing"
            size="sm"
            options={[
              { value: 'content-box', label: 'content-box' },
              { value: 'border-box', label: 'border-box' },
            ]}
            value={input.boxSizing}
            onChange={(boxSizing) => setInput((i) => ({ ...i, boxSizing }))}
          />
        )}
      </div>

      <div className={styles.stage} ref={ref}>
        <div
          className={styles.diagram}
          role="img"
          aria-label={`Margin ${input.margin}px, border ${input.border}px, padding ${input.padding}px, content ${box.content.width} by ${box.content.height}px.`}
          style={{
            inlineSize: box.marginBox.width * scale,
            blockSize: box.marginBox.height * scale,
          }}
        >
          <div className={styles.scaled} style={{ transform: `scale(${scale})` }}>
            <div
              className={styles.margin}
              style={{ padding: input.margin, inlineSize: box.marginBox.width }}
            >
              <span className={styles.tag}>margin {input.margin}</span>
              <div className={styles.border} style={{ padding: input.border }}>
                <span className={styles.tag}>border {input.border}</span>
                <div className={styles.padding} style={{ padding: input.padding }}>
                  <span className={styles.tag}>padding {input.padding}</span>
                  <div
                    className={styles.content}
                    style={{ inlineSize: box.content.width, blockSize: box.content.height }}
                  >
                    {box.content.width} × {box.content.height}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.readout}>
        <p aria-live="polite">{box.explanation}</p>
        <p className={styles.muted}>
          With margins, it takes {box.marginBox.width}px of horizontal space.
        </p>
        <pre className={styles.code}>
          <code>{cssFor(input)}</code>
        </pre>
      </div>
    </div>
  );
}
