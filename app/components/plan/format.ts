export function metres(mm: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    mm / 1_000,
  );
}

export function money(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function parseMetres(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 1_000);
}

export function seatsLabel(
  count: number,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  return count === 1 ? t("plan.seatEach") : t("plan.seatsEach", { count });
}
