import type { ReactNode } from 'react';
import styles from './cards.module.scss';

type CardStatProps = {
  label: string;
  value: ReactNode;
  /** The value the list is sorted by. */
  highlighted?: boolean;
};

/** One label/value cell in a card's stats grid. */
export const CardStat = ({
  label,
  value,
  highlighted = false,
}: CardStatProps) => (
  <div className={`${styles.stat} ${highlighted ? styles.statSorted : ''}`}>
    <span className={styles.stat__label}>{label}</span>
    <span className={styles.stat__value}>{value}</span>
  </div>
);

type RevenueBoxProps = {
  label: string;
  value: string;
  /** The list is sorted by revenue. */
  highlighted?: boolean;
};

/** A card's revenue: a green square beside the preview, the same height. */
export const RevenueBox = ({
  label,
  value,
  highlighted = false,
}: RevenueBoxProps) => (
  <div
    className={`${styles.revenueBox} ${highlighted ? styles.revenueBoxSorted : ''}`}
  >
    <span className={styles.revenueBox__label}>{label}</span>
    <span className={styles.revenueBox__value}>{value}</span>
  </div>
);
