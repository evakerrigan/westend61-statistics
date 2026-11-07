import { useI18n } from '@/hooks/use-i18n';
import { formatMoney } from '@/utils/format';
import type { PartnerTotals } from '../utils/aggregate';
import { partnerSortKey } from '../utils/partner-columns';
import { partnerLabel } from '../utils/shoot-labels';
import { BreakableName } from './breakable-name';
import { SortHeader, type SortState, StackedSortHeader } from './sort-header';
import { StackRow } from './stack-row';
import styles from './table.module.scss';

type PartnerHeadersProps = SortState & {
  partners: string[];
  /** One stacked column instead of a column per partner. */
  compact: boolean;
};

export const PartnerHeaders = ({
  partners,
  compact,
  ...sort
}: PartnerHeadersProps) => {
  const { t } = useI18n();
  if (!partners.length) return null;
  if (compact) {
    return (
      <StackedSortHeader
        columns={partners.map((p) => ({
          label: partnerLabel(p, t),
          columnKey: partnerSortKey(p),
        }))}
        numeric
        {...sort}
      />
    );
  }
  return partners.map((p) => (
    <SortHeader
      key={p}
      label={<BreakableName name={partnerLabel(p, t)} />}
      columnKey={partnerSortKey(p)}
      numeric
      className={styles.table__partnerHead}
      {...sort}
    />
  ));
};

type PartnerCellsProps = {
  partners: string[];
  byPartner: PartnerTotals;
  compact: boolean;
  /** The table's sort key: the partner sorted by is highlighted. */
  sortKey: string;
};

export const PartnerCells = ({
  partners,
  byPartner,
  compact,
  sortKey,
}: PartnerCellsProps) => {
  const { t } = useI18n();
  const isSorted = (p: string) => partnerSortKey(p) === sortKey;
  const amount = (p: string) =>
    byPartner[p] ? formatMoney(byPartner[p]) : '—';
  if (!partners.length) return null;
  if (compact) {
    return (
      <td className={`${styles.table__num} ${styles.table__compact}`}>
        <div className={styles.table__pairs}>
          {partners.map((p) => (
            <StackRow
              key={p}
              label={partnerLabel(p, t)}
              value={amount(p)}
              highlighted={isSorted(p)}
            />
          ))}
        </div>
      </td>
    );
  }
  return partners.map((p) => (
    <td
      key={p}
      className={`${styles.table__num} ${isSorted(p) ? styles.table__sorted : ''}`}
    >
      {amount(p)}
    </td>
  ));
};
