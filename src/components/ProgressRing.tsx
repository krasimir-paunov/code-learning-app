import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  value: number;
  max: number;
  /** Accessible description, e.g. "3 of 5 lessons completed". */
  label: string;
  size?: number;
  /** Ring color as a semantic token name, e.g. "--track-css". */
  colorToken?: string;
}

export function ProgressRing({
  value,
  max,
  label,
  size = 40,
  colorToken = '--success',
}: ProgressRingProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <svg
      className={styles.ring}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      style={{ ['--ring-color' as string]: `var(${colorToken})` }}
    >
      <circle
        className={styles.track}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
      />
      <circle
        className={styles.value}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
