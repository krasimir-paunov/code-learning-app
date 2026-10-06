import type { ElementType } from 'react';
import styles from './Glitch.module.css';
import { useMotionPreference } from './motion.ts';
import { cx } from '../components/cx.ts';

interface GlitchProps {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * One-shot glitch (≤ 600 ms, offset/clip only, no luminance strobing) for reward moments.
 * With reduced effects it becomes a short fade; with effects off the text simply appears.
 */
export function Glitch({ text, as: Tag = 'span', className, id }: GlitchProps) {
  const level = useMotionPreference();
  return (
    <Tag
      id={id}
      className={cx(level === 'full' ? styles.glitch : styles.fade, className)}
      data-text={text}
    >
      {text}
    </Tag>
  );
}
