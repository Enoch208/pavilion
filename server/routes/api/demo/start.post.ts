import {
  createBetterAuthSessionForEmail,
  ensureIdentityUser,
  setBetterAuthSessionCookie,
} from "@agent-native/core/server";
import { defineEventHandler, type H3Event } from "h3";

import { ensureDemoEvent } from "../../../lib/demo/seed.js";
import { clientIp, hashIp } from "../../../lib/guests/client-ip.js";
import {
  GUEST_START_RULE,
  takeRateSlot,
} from "../../../lib/guests/rate-limit.js";
import {
  guestExpiry,
  newGuestEmail,
  recordGuestSession,
  removeExpiredGuests,
} from "../../../lib/guests/sessions.js";

const GUEST_NAME = "Guest";

function failure(
  event: H3Event,
  status: number,
  errorCode: string,
  error: string,
) {
  event.res.status = status;
  return { ok: false as const, errorCode, error };
}

export default defineEventHandler(async (event) => {
  const ip = clientIp(event);
  const slot = await takeRateSlot(GUEST_START_RULE, ip);
  if (!slot.allowed) {
    event.res.headers.set("retry-after", String(slot.retryAfterSeconds));
    return failure(
      event,
      429,
      "RATE_LIMITED",
      slot.scope === "key"
        ? "Too many demo sandboxes from this network. Try again within the hour."
        : "The demo is busy right now. Try again later.",
    );
  }
  await removeExpiredGuests();
  const email = newGuestEmail();
  const expiresAt = guestExpiry();
  await ensureIdentityUser(email, GUEST_NAME, undefined, {
    emailVerified: true,
  });
  const session = await createBetterAuthSessionForEmail(email, undefined, {
    expiresAt,
  });
  if (!session) {
    return failure(
      event,
      503,
      "GUEST_SESSION_UNAVAILABLE",
      "Could not start a demo sandbox. Try again in a moment.",
    );
  }
  await recordGuestSession({
    ownerEmail: email,
    ipHash: hashIp(ip),
    expiresAt,
  });
  const demo = await ensureDemoEvent({ ownerEmail: email, actor: "system" });
  await setBetterAuthSessionCookie(event, session.token);
  return { ok: true as const, eventId: demo.eventId };
});
