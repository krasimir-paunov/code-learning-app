import {
  CircleAlert,
  Download,
  ExternalLink,
  Hash,
  Mail,
  Phone,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useMotionPreference } from '../../effects/motion.ts';
import type { VisualizerViewProps } from '../contract.ts';
import type { LinkLabProps } from './build.ts';
import { analyzeLink, toMarkup, type LinkInput, type LinkKind } from './model.ts';
import styles from './View.module.css';

const KIND_ICON: Record<LinkKind, ReactNode> = {
  page: <SquareArrowOutUpRight aria-hidden="true" />,
  fragment: <Hash aria-hidden="true" />,
  email: <Mail aria-hidden="true" />,
  phone: <Phone aria-hidden="true" />,
  download: <Download aria-hidden="true" />,
  invalid: <CircleAlert aria-hidden="true" />,
  none: <CircleAlert aria-hidden="true" />,
};

export default function LinkLabView({ props }: VisualizerViewProps<LinkLabProps>) {
  const motion = useMotionPreference();
  const [preset, setPreset] = useState('0');
  const [link, setLink] = useState<LinkInput>(
    props.presets[0]?.link ?? { href: '', text: '', newTab: false, download: false },
  );
  const [clicked, setClicked] = useState(false);
  const [hovering, setHovering] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const outcome = analyzeLink(
    link,
    props.pageUrl,
    props.sections.map((section) => section.id),
  );
  const update = (patch: Partial<LinkInput>) => {
    setLink((l) => ({ ...l, ...patch }));
    setClicked(false);
  };

  const follow = () => {
    setClicked(true);
    if (outcome.kind !== 'fragment' || !outcome.resolved) return;
    const id = decodeURIComponent(new URL(outcome.resolved).hash.slice(1));
    const target = pageRef.current?.querySelector(`[data-section="${CSS.escape(id)}"]`);
    target?.scrollIntoView({ behavior: motion === 'full' ? 'smooth' : 'auto', block: 'nearest' });
  };

  return (
    <div className={styles.frame}>
      <SegmentedControl
        label="Start from"
        size="sm"
        options={props.presets.map((p, i) => ({ value: String(i), label: p.label }))}
        value={preset}
        onChange={(value) => {
          setPreset(value);
          const next = props.presets[Number(value)];
          if (next) setLink(next.link);
          setClicked(false);
        }}
      />
      <div className={styles.lab}>
        <div className={styles.builder}>
          <label className={styles.field}>
            <span className={styles.mono}>href</span>
            <input
              value={link.href}
              onChange={(event) => update({ href: event.target.value })}
              spellCheck={false}
            />
          </label>
          <label className={styles.field}>
            <span>Link text</span>
            <input value={link.text} onChange={(event) => update({ text: event.target.value })} />
          </label>
          <div className={styles.checks}>
            <label>
              <input
                type="checkbox"
                checked={link.newTab}
                onChange={(event) => update({ newTab: event.target.checked })}
              />{' '}
              <code>target="_blank"</code>
            </label>
            <label>
              <input
                type="checkbox"
                checked={link.download}
                onChange={(event) => update({ download: event.target.checked })}
              />{' '}
              <code>download</code>
            </label>
          </div>
          <pre className={styles.markup}>
            <code>{toMarkup(link)}</code>
          </pre>
        </div>

        <div className={styles.browser}>
          <div className={styles.address} aria-live="polite">
            {clicked &&
            outcome.resolved &&
            (outcome.kind === 'page' || outcome.kind === 'fragment') ? (
              <>
                {link.newTab && outcome.kind === 'page' && (
                  <span className={styles.tabChip}>New tab</span>
                )}
                <span className={styles.visited}>{outcome.resolved}</span>
              </>
            ) : (
              props.pageUrl
            )}
          </div>
          <div className={styles.page} ref={pageRef}>
            <p>
              {link.href ? (
                <a
                  // Only schemes the model understands are rendered; never javascript: and the like.
                  href={outcome.kind === 'invalid' ? '#' : (outcome.resolved ?? '#')}
                  className={styles.link}
                  onClick={(event) => {
                    event.preventDefault();
                    follow();
                  }}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  onFocus={() => setHovering(true)}
                  onBlur={() => setHovering(false)}
                >
                  {link.text || '(no text)'}
                  {link.newTab && <ExternalLink aria-hidden="true" className={styles.newTab} />}
                </a>
              ) : (
                <span className={styles.notLink}>{link.text || '(no text)'}</span>
              )}
            </p>
            {props.sections.map((section) => (
              <section
                key={section.id}
                data-section={section.id}
                className={styles.section}
                aria-label={`Demo section ${section.title}`}
              >
                <h3>{section.title}</h3>
                <p className={styles.sectionId}>id="{section.id}"</p>
              </section>
            ))}
          </div>
          <div className={styles.statusBar} aria-hidden="true">
            {hovering && outcome.resolved ? outcome.resolved : ' '}
          </div>
        </div>
      </div>

      <div className={styles.result} aria-live="polite">
        <p className={styles.resultTitle}>
          {KIND_ICON[outcome.kind]}
          {clicked ? 'You clicked it:' : 'Click the link in the page. It will:'}
        </p>
        <ol className={styles.steps}>
          {outcome.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {outcome.warnings.map((warning) => (
          <p key={warning} className={styles.warning}>
            <CircleAlert aria-hidden="true" /> {warning}
          </p>
        ))}
      </div>
    </div>
  );
}
