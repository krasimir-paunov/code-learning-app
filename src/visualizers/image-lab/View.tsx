import { Check, Image as ImageIcon, ImageOff, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { Tabs } from '../../components/Tabs.tsx';
import { Toggle } from '../../components/Toggle.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { ImageLabProps } from './build.ts';
import { imgTag, judgeAlt, type AltValue, type LabImage } from './model.ts';
import styles from './View.module.css';

type AltMode = 'none' | 'empty' | 'text';

function AltCard({ image, imagesOff }: { image: LabImage; imagesOff: boolean }) {
  const [mode, setMode] = useState<AltMode>('none');
  const [text, setText] = useState('');
  const alt: AltValue = mode === 'none' ? null : mode === 'empty' ? '' : text;
  const verdict = judgeAlt(image, alt);

  let picture;
  if (!imagesOff) {
    picture = (
      <div className={styles.picture}>
        <ImageIcon aria-hidden="true" />
        <span>{image.shows}</span>
      </div>
    );
  } else if (alt === '') {
    picture = <div className={styles.gone}>(nothing: decorative images disappear)</div>;
  } else {
    picture = (
      <div className={styles.broken}>
        <ImageOff aria-hidden="true" />
        <span>{alt ?? ''}</span>
      </div>
    );
  }

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <code className={styles.file}>{image.file}</code>
        <span className={styles.purpose}>
          {image.purpose === 'link' ? `link to ${image.linkTo}` : image.purpose}
        </span>
      </div>
      {picture}
      <SegmentedControl<AltMode>
        label={`alt for ${image.file}`}
        size="sm"
        options={[
          { value: 'none', label: 'No alt' },
          { value: 'empty', label: 'alt=""' },
          { value: 'text', label: 'Text' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'text' && (
        <input
          className={styles.altInput}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label={`Alt text for ${image.file}`}
          placeholder="Describe it…"
        />
      )}
      <code className={styles.tag}>{imgTag(image, alt)}</code>
      <p className={styles.announced}>
        <span className={styles.announcedLabel}>Screen reader:</span> {verdict.announced}
      </p>
      <p className={styles.verdict} data-ok={verdict.ok || undefined}>
        {verdict.ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
        {verdict.advice}
      </p>
    </li>
  );
}

/** One moment of the page load, reporting where the text below the image ends up. */
function Moment({
  html,
  css,
  title,
  onMeasure,
}: {
  html: string;
  css: string;
  title: string;
  onMeasure: (top: number) => void;
}) {
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const report = useRef(onMeasure);
  useLayoutEffect(() => {
    report.current = onMeasure;
  });
  // Images decode asynchronously, so measure again whenever the page's size changes.
  useEffect(() => {
    if (!root) return;
    const host = root.host;
    const measure = () => {
      const text = root.querySelector('p')?.getBoundingClientRect();
      if (text) report.current(Math.round(text.top - host.getBoundingClientRect().top));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [root, html]);
  return (
    <figure className={styles.moment}>
      <figcaption className={styles.momentTitle}>{title}</figcaption>
      <ShadowStage
        html={html}
        css={css}
        className={styles.momentStage}
        onRender={(shadow) => setRoot((current) => current ?? shadow)}
        inert
      />
    </figure>
  );
}

function LayoutShift({ layout }: { layout: ImageLabProps['layout'] }) {
  const [dims, setDims] = useState(false);
  const [before, setBefore] = useState(0);
  const [after, setAfter] = useState(0);
  const size = dims ? ` width="${layout.width}" height="${layout.height}"` : '';
  const css =
    'img { display: block; width: 100%; height: auto; margin: 8px 0; } h3 { margin: 0; } p { margin: 0 0 8px; }';
  const page = (img: string) =>
    `<h3>${layout.heading}</h3>${img}<p>${layout.text}</p><button>${layout.button}</button>`;
  // While loading, the image has no pixels yet; alt="" keeps the browser from drawing alt text.
  const loading = page(`<img alt=""${size}>`);
  const loaded = page(`<img src="${layout.image}" alt=""${size}>`);
  const shift = after - before;

  return (
    <div className={styles.shift}>
      <Toggle
        label={`width and height attributes`}
        description="Tell the browser the image's size before it downloads"
        checked={dims}
        onChange={setDims}
      />
      <code className={styles.tag}>{`<img src="trail.jpg" alt="…"${size}>`}</code>
      <div className={styles.moments}>
        <Moment
          html={loading}
          css={css}
          title="While the image loads"
          onMeasure={(top) => setBefore((v) => (v === top ? v : top))}
        />
        <Moment
          html={loaded}
          css={css}
          title="Once it has loaded"
          onMeasure={(top) => setAfter((v) => (v === top ? v : top))}
        />
      </div>
      <p className={styles.shiftResult} data-ok={shift === 0 || undefined} aria-live="polite">
        {shift === 0
          ? 'Nothing moved: the browser reserved the space from width and height.'
          : `The text and the button jumped ${shift}px down when the image arrived. Anyone about to tap the button hits something else.`}
      </p>
    </div>
  );
}

export default function ImageLabView({ props }: VisualizerViewProps<ImageLabProps>) {
  const [tab, setTab] = useState('alt');
  const [imagesOff, setImagesOff] = useState(false);
  return (
    <div className={styles.frame}>
      <Tabs
        label="Experiment"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: 'alt',
            label: 'Alt text',
            content: (
              <div className={styles.panel}>
                <Toggle
                  label="Images off"
                  checked={imagesOff}
                  onChange={setImagesOff}
                  description="Show what people see when images fail to load"
                />
                <ul className={styles.cards}>
                  {props.images.map((image) => (
                    <AltCard key={image.id} image={image} imagesOff={imagesOff} />
                  ))}
                </ul>
              </div>
            ),
          },
          {
            id: 'shift',
            label: 'Layout shift',
            content: (
              <div className={styles.panel}>
                <LayoutShift layout={props.layout} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
