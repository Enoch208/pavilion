export type SummaryInput = {
  attendeeTarget: number;
  budgetCents: number;
  objects: readonly { capacity: number; unitCostCents: number }[];
};

export type LayoutSummary = {
  seats: number;
  attendeeTarget: number;
  unseated: number;
  totalCostCents: number;
  budgetCents: number;
  remainingCents: number;
  overBudget: boolean;
};

export function summarizeLayout(input: SummaryInput): LayoutSummary {
  const seats = input.objects.reduce((sum, item) => sum + item.capacity, 0);
  const totalCostCents = input.objects.reduce(
    (sum, item) => sum + item.unitCostCents,
    0,
  );
  const remainingCents = input.budgetCents - totalCostCents;
  return {
    seats,
    attendeeTarget: input.attendeeTarget,
    unseated: Math.max(0, input.attendeeTarget - seats),
    totalCostCents,
    budgetCents: input.budgetCents,
    remainingCents,
    overBudget: remainingCents < 0,
  };
}
