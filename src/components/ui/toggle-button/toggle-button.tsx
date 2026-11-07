import type { ReactNode } from 'react';
import styles from './toggle-button.module.scss';

type ToggleButtonProps = {
  /** Accessible name and tooltip, e.g. what the button switches to. */
  label: string;
  onClick: () => void;
  children: ReactNode;
};

/** A small square header button for switching a setting (theme, language). */
export const ToggleButton = ({
  label,
  onClick,
  children,
}: ToggleButtonProps) => (
  <button
    type="button"
    className={styles.toggleButton}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);
