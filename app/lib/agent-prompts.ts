import { z } from "zod";

const navigationSchema = z.object({
  view: z.string().optional(),
  eventId: z.string().optional(),
});

const selectionSchema = z.object({
  eventId: z.string(),
  objectIds: z.array(z.string()),
});

export const FALLBACK_PROMPT_KEYS = [
  "agentPrompts.openPlan",
  "agentPrompts.capabilities",
  "agentPrompts.proposals",
] as const;

const PLAN_PROMPT_KEYS = [
  "agentPrompts.fitMoreSeats",
  "agentPrompts.checkPlan",
  "agentPrompts.exportPack",
] as const;

const SELECTION_PROMPT_KEYS = [
  "agentPrompts.describeSelection",
  "agentPrompts.lockSelection",
  "agentPrompts.fitMoreSeats",
] as const;

const PACK_PROMPT_KEYS = [
  "agentPrompts.summarizePack",
  "agentPrompts.costliestItems",
  "agentPrompts.backToPlan",
] as const;

export type AgentPromptKey =
  | (typeof FALLBACK_PROMPT_KEYS)[number]
  | (typeof PLAN_PROMPT_KEYS)[number]
  | (typeof SELECTION_PROMPT_KEYS)[number]
  | (typeof PACK_PROMPT_KEYS)[number];

type PromptContext = { navigation: unknown; selection: unknown };

function hasPlanSelection(selection: unknown, eventId: string | undefined) {
  const parsed = selectionSchema.safeParse(selection);
  return (
    parsed.success &&
    parsed.data.eventId === eventId &&
    parsed.data.objectIds.length > 0
  );
}

export function agentPromptKeys(
  context: PromptContext,
): readonly AgentPromptKey[] {
  const navigation = navigationSchema.safeParse(context.navigation);
  if (!navigation.success) return [];
  const { view, eventId } = navigation.data;
  if (view === "pack") return PACK_PROMPT_KEYS;
  if (view !== "event") return [];
  return hasPlanSelection(context.selection, eventId)
    ? SELECTION_PROMPT_KEYS
    : PLAN_PROMPT_KEYS;
}
