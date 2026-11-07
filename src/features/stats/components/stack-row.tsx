import styles from './table.module.scss';

/**
 * One label/value line inside a `table__pairs` cell: labels line up in one
 * column, values in the next.
 */
export const StackRow = ({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  /** Marks the line the table is sorted by. */
  highlighted?: boolean;
}) => {
  const mark = highlighted ? styles.table__sorted : '';
  return (
    <>
      <span className={`${styles.table__stackLabel} ${mark}`}>{label}</span>
      <span className={`${styles.table__pairsValue} ${mark}`}>{value}</span>
    </>
  );
};
