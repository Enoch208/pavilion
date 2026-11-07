import type { ActionCaller, ActionRunContext } from "@agent-native/core/action";

import { reject } from "./errors.js";

export type Actor = "human" | "agent" | "system";

export type Scope = { ownerEmail: string; actor: Actor };

const AGENT_CALLERS: ReadonlySet<ActionCaller> = new Set([
  "tool",
  "mcp",
  "webmcp",
  "a2a",
]);
const SYSTEM_CALLERS: ReadonlySet<ActionCaller> = new Set([
  "automation",
  "cli",
]);

export function actorFor(caller: ActionCaller | undefined): Actor {
  if (!caller) return "system";
  if (AGENT_CALLERS.has(caller)) return "agent";
  if (SYSTEM_CALLERS.has(caller)) return "system";
  return "human";
}

export function requireScope(ctx: ActionRunContext | undefined): Scope {
  const ownerEmail = ctx?.userEmail?.trim().toLowerCase();
  if (!ownerEmail) {
    reject("UNAUTHENTICATED", "Sign in to plan an event.");
  }
  return { ownerEmail, actor: actorFor(ctx?.caller) };
}
