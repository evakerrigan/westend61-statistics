import type { ReactNode } from 'react';
import type { SortDirection } from '../hooks/use-sort';
import styles from './table.module.scss';

export type SortState = {
  sortKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
};

type SortHeaderProps = SortState & {
  label: ReactNode;
  columnKey: string;
  numeric?: boolean;
  className?: string;
};

const SortButton = ({
  label,
  columnKey,
  sortKey,
  direction,
  onSort,
}: SortState & { label: ReactNode; columnKey: string }) => {
  const active = columnKey === sortKey;
  return (
    <button
      type="button"
      className={`${styles.table__sort} ${active ? styles.table__sortActive : ''}`}
      onClick={() => onSort(columnKey)}
    >
      <span>{label}</span>
      {/* The active column gets a big coloured arrow; others hint on hover. */}
      <span
        aria-hidden="true"
        className={active ? styles.table__sortArrow : styles.table__sortHint}
      >
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
};

const ariaSort = (active: boolean, direction: SortDirection) =>
  active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

export const SortHeader = ({
  label,
  columnKey,
  numeric = false,
  className,
  ...sort
}: SortHeaderProps) => (
  <th
    className={
      [numeric ? styles.table__num : '', className].filter(Boolean).join(' ') ||
      undefined
    }
    aria-sort={ariaSort(columnKey === sort.sortKey, sort.direction)}
  >
    <SortButton label={label} columnKey={columnKey} {...sort} />
  </th>
);

type StackedSortHeaderProps = SortState & {
  /** One sort button per line, matching the stacked values in the cells. */
  columns: { label: string; columnKey: string }[];
  numeric?: boolean;
  className?: string;
};

export const StackedSortHeader = ({
  columns,
  numeric = false,
  className,
  ...sort
}: StackedSortHeaderProps) => {
  const active = columns.some((c) => c.columnKey === sort.sortKey);
  return (
    <th
      className={
        [numeric ? styles.table__num : '', className]
          .filter(Boolean)
          .join(' ') || undefined
      }
      aria-sort={ariaSort(active, sort.direction)}
    >
      <div className={styles.table__stack}>
        {columns.map((c) => (
          <SortButton key={c.columnKey} {...c} {...sort} />
        ))}
      </div>
    </th>
  );
};
