import { useI18n } from '@/hooks/use-i18n';
import type { SortState } from './sort-header';
import styles from './cards.module.scss';

type SortBarProps = SortState & {
  /** The same sort options as the table's column headers. */
  options: { label: string; columnKey: string }[];
};

/** Card layout's replacement for the sortable table header. */
export const SortBar = ({
  options,
  sortKey,
  direction,
  onSort,
}: SortBarProps) => {
  const { t } = useI18n();
  const label = direction === 'asc' ? t('sort.asc') : t('sort.desc');
  return (
    <div className={styles.sortBar}>
      <span className={styles.sortBar__label}>{t('sort.by')}</span>
      <select
        value={sortKey}
        // Picking a new field sorts it descending, like clicking its header.
        onChange={(e) => onSort(e.target.value)}
        aria-label={t('sort.by')}
        className={styles.sortBar__select}
      >
        {options.map((o) => (
          <option key={o.columnKey} value={o.columnKey}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.sortBar__direction}
        onClick={() => onSort(sortKey)}
        aria-label={label}
        title={label}
      >
        {direction === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
};
