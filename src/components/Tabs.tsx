import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';
import { cx } from './cx.ts';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  /** Accessible name of the tab list. */
  label: string;
  tabs: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  /** Extra controls rendered at the end of the tab bar (e.g. a copy button). */
  actions?: ReactNode;
}

/** WAI-ARIA tabs with automatic activation: arrows, Home and End move and select. */
export function Tabs({ label, tabs, value, onChange, className, actions }: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: selectedIndex === last ? 0 : selectedIndex + 1,
      ArrowLeft: selectedIndex === 0 ? last : selectedIndex - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={cx(styles.tabs, className)}>
      <div className={styles.bar}>
        <div role="tablist" aria-label={label} className={styles.list}>
          {tabs.map((tab, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${index}`}
                tabIndex={selected ? 0 : -1}
                className={styles.tab}
                onClick={() => onChange(tab.id)}
                onKeyDown={onKeyDown}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== selectedIndex}
          className={styles.panel}
        >
          {index === selectedIndex && tab.content}
        </div>
      ))}
    </div>
  );
}
