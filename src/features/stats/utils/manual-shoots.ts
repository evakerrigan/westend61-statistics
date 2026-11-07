import type { ManualShoot } from '@/types/westend';

// Pure updates for the user's hand-made shoots. An image belongs to at most
// one manual shoot, so adding it somewhere removes it everywhere else.

const without = (shoots: ManualShoot[], productIds: string[]) => {
  const ids = new Set(productIds);
  return shoots.map((s) => ({
    ...s,
    productIds: s.productIds.filter((id) => !ids.has(id)),
  }));
};

export const createManualShoot = (
  shoots: ManualShoot[],
  title: string,
  productIds: string[]
): ManualShoot[] => [
  ...without(shoots, productIds),
  {
    id: crypto.randomUUID(),
    title: title.trim(),
    productIds,
    createdAt: new Date().toISOString(),
  },
];

export const addToManualShoot = (
  shoots: ManualShoot[],
  shootId: string,
  productIds: string[]
): ManualShoot[] =>
  without(shoots, productIds).map((s) =>
    s.id === shootId
      ? { ...s, productIds: [...s.productIds, ...productIds] }
      : s
  );

export const removeFromManualShoot = (
  shoots: ManualShoot[],
  productIds: string[]
): ManualShoot[] => without(shoots, productIds);

export const renameManualShoot = (
  shoots: ManualShoot[],
  shootId: string,
  title: string
): ManualShoot[] =>
  shoots.map((s) => (s.id === shootId ? { ...s, title: title.trim() } : s));

export const deleteManualShoot = (
  shoots: ManualShoot[],
  shootId: string
): ManualShoot[] => shoots.filter((s) => s.id !== shootId);
