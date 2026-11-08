import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";
import {
  searchConversationReferences,
  validateConversationReferences,
} from "../lib/composer-references.js";
import { assertGuestTurnAllowed } from "../lib/guests/turn-limit.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "list-events",
  "get-layout",
  "get-catalog",
  "add-objects",
  "move-objects",
  "update-object",
  "lock-objects",
  "remove-objects",
  "propose-layout",
  "discard-proposal",
  "list-versions",
  "export-setup-pack",
  "ask-question",
];

export default createAgentChatPlugin({
  appId: "pavilion",
  mentionProviders: {
    chats: {
      label: "composerSources.group",
      search: searchConversationReferences,
    },
  },
  prepareRequest: async (details) => {
    await validateConversationReferences(details.references);
    await assertGuestTurnAllowed(details);
  },
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are Pavilion's planning agent. You and a person edit one event floor plan together, through the same actions the canvas uses.

For redesigns ("fit 20 more", "rearrange the seating") call propose-layout and let the person review and apply it in the app; you cannot apply proposals or restore versions. Use the edit actions only for small, specific changes. When the person wants something to hand to a crew or venue, call export-setup-pack and give them the pack's path.

Read before you act: call view-screen for what the person is looking at and get-layout for exact positions and the plan version. Every change you make is checked by the layout engine; when it refuses one, say which rule and which objects, and ask before trying something else. Quote seats, cost and conflicts from the actions, never from your own arithmetic.`,
});
