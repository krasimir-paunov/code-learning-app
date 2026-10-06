import { CircleAlert, CircleCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { VisualizerViewProps } from '../contract.ts';
import { ShadowStage } from '../shared/ShadowStage.tsx';
import type { SkeletonTogglesProps } from './build.ts';
import {
  ALL_ON,
  assemble,
  documentLines,
  misdecoded,
  phoneLayoutWidth,
  phoneTextScale,
  tabLabel,
  type SkeletonLine,
  type Toggles,
} from './model.ts';
import styles from './View.module.css';

const LINE_NAME: Record<SkeletonLine, string> = {
  doctype: 'doctype',
  lang: 'lang attribute',
  charset: 'charset',
  viewport: 'viewport',
  title: 'title',
};

/** On-screen width of the drawn phone; it stands for a 375 CSS px wide device. */
const PHONE_SCREEN = 200;
const PHONE_HEIGHT = 230;

function Effect({ ok, title, children }: { ok: boolean; title: string; children: ReactNode }) {
  return (
    <section className={styles.effect} data-ok={ok} aria-label={title}>
      <h3 className={styles.effectTitle}>
        {ok ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
        {title}
        <span className="visually-hidden">{ok ? ': fine' : ': problem'}</span>
      </h3>
      {children}
    </section>
  );
}

export default function SkeletonTogglesView({ props }: VisualizerViewProps<SkeletonTogglesProps>) {
  const { page } = props;
  const [on, setOn] = useState<Toggles>(ALL_ON);
  const html = assemble(page, on);
  // The real HTML parser decides the rendering mode.
  const mode = new DOMParser().parseFromString(html, 'text/html').compatMode;
  const quirks = mode === 'BackCompat';
  const show = (text: string) => (on.charset ? text : misdecoded(text));
  const layoutWidth = phoneLayoutWidth(on);
  const scale = PHONE_SCREEN / layoutWidth;
  const percent = Math.round(phoneTextScale(on) * 100);
  const pageHtml = `<h1>${show(page.heading)}</h1>${page.body.map((p) => `<p>${show(p)}</p>`).join('')}`;

  return (
    <div className={styles.frame}>
      <div className={styles.lab}>
        <div className={styles.source}>
          <p className={styles.fileName}>{page.fileName}</p>
          <ol className={styles.lines}>
            {documentLines(page, on).map((line, index) => {
              const removed = line.line !== undefined && line.line !== 'lang' && !on[line.line];
              return (
                <li key={index} className={styles.line} data-removed={removed || undefined}>
                  {line.line ? (
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={on[line.line]}
                        onChange={(event) => {
                          const key = line.line as SkeletonLine;
                          setOn((current) => ({ ...current, [key]: event.target.checked }));
                        }}
                      />
                      <span className="visually-hidden">Keep the {LINE_NAME[line.line]}</span>
                    </label>
                  ) : (
                    <span className={styles.spacer} />
                  )}
                  <code>{line.text}</code>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={styles.effects} aria-live="polite">
          <Effect ok={on.title} title="Browser tab">
            <div className={styles.tab}>
              <span className={styles.favicon} aria-hidden="true" />
              <span className={styles.tabText}>{show(tabLabel(page, on))}</span>
            </div>
            <p>
              {on.title
                ? 'The title names the tab, bookmarks and search results.'
                : `No title: the tab shows the file name, ${page.fileName}.`}
            </p>
          </Effect>

          <Effect ok={on.viewport} title="Phone">
            <div
              className={styles.phone}
              style={{ inlineSize: PHONE_SCREEN, blockSize: PHONE_HEIGHT }}
            >
              <div
                className={styles.phonePage}
                style={{ inlineSize: layoutWidth, transform: `scale(${scale})` }}
              >
                <ShadowStage
                  html={pageHtml}
                  css="h1 { font-size: 28px; } p { font-size: 17px; }"
                  inert
                />
              </div>
            </div>
            <p>
              {on.viewport
                ? 'Laid out at the phone’s own width, 375 px: text at full size.'
                : `Laid out 980 px wide, like a desktop, then shrunk to fit: text at ${percent}% size. People have to pinch to zoom.`}
            </p>
          </Effect>

          <Effect ok={!quirks} title="Rendering mode">
            <p>
              <code>document.compatMode</code> is <code>{mode}</code>.
            </p>
            <p>
              {quirks
                ? 'Quirks mode: without a doctype the browser imitates the layout bugs of 1990s browsers.'
                : 'Standards mode: the browser follows today’s CSS rules.'}
            </p>
          </Effect>

          <Effect ok={on.charset} title="Text encoding">
            <p className={styles.sample}>{show(page.heading)}</p>
            <p>
              {on.charset
                ? 'UTF-8 declared: every character arrives intact.'
                : 'Nothing declares the encoding, so the browser guesses. This is the common wrong guess, Windows-1252.'}
            </p>
          </Effect>

          <Effect ok={on.lang} title="Language">
            <p>
              {on.lang
                ? `lang="${page.lang}": screen readers choose the right voice and pronunciation; translation and hyphenation know the language.`
                : 'No lang: screen readers read the page in the user’s default language, and translation tools have to guess.'}
            </p>
          </Effect>
        </div>
      </div>
    </div>
  );
}
