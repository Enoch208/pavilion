import { describe, expect, it } from "vitest";

import { agentPromptKeys, FALLBACK_PROMPT_KEYS } from "@/lib/agent-prompts";

import enUS from "../../app/i18n/en-US";

const PLAN = { view: "event", eventId: "evt-1" };

describe("agent prompts", () => {
  it("offers the redesign, a check and an export on a floor plan", () => {
    expect(agentPromptKeys({ navigation: PLAN, selection: null })).toEqual([
      "agentPrompts.fitMoreSeats",
      "agentPrompts.checkPlan",
      "agentPrompts.exportPack",
    ]);
  });

  it("leads with the selection when items on this plan are selected", () => {
    const selection = { eventId: "evt-1", objectIds: ["chair-1"] };
    expect(agentPromptKeys({ navigation: PLAN, selection })[0]).toBe(
      "agentPrompts.describeSelection",
    );
  });

  it("ignores an empty selection or one left over from another event", () => {
    for (const selection of [
      { eventId: "evt-1", objectIds: [] },
      { eventId: "evt-2", objectIds: ["chair-1"] },
    ]) {
      expect(agentPromptKeys({ navigation: PLAN, selection })[0]).toBe(
        "agentPrompts.fitMoreSeats",
      );
    }
  });

  it("offers pack prompts on a setup pack", () => {
    const navigation = { view: "pack", eventId: "evt-1", packId: "pack-1" };
    expect(agentPromptKeys({ navigation, selection: null })).toContain(
      "agentPrompts.summarizePack",
    );
  });

  it("falls back to the app's starters elsewhere", () => {
    expect(
      agentPromptKeys({ navigation: { view: "events" }, selection: null }),
    ).toEqual([]);
    expect(agentPromptKeys({ navigation: null, selection: null })).toEqual([]);
  });

  it("has English text for every prompt", () => {
    const keys = [
      ...FALLBACK_PROMPT_KEYS,
      ...agentPromptKeys({ navigation: PLAN, selection: null }),
      ...agentPromptKeys({
        navigation: PLAN,
        selection: { eventId: "evt-1", objectIds: ["a"] },
      }),
      ...agentPromptKeys({ navigation: { view: "pack" }, selection: null }),
    ];
    const prompts: Record<string, string> = enUS.agentPrompts;
    for (const key of keys) {
      expect(prompts[key.replace("agentPrompts.", "")]).toBeTruthy();
    }
  });
});
