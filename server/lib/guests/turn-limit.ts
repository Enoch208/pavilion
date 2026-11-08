import { HTTPError, type H3Event } from "h3";

import { isGuestEmail } from "../../../shared/guest.js";
import { clientIp } from "./client-ip.js";
import {
  GUEST_TURN_IP_RULE,
  GUEST_TURN_RULE,
  takeRateSlot,
  type RateDecision,
} from "./rate-limit.js";

type TurnDetails = {
  event: H3Event;
  ownerEmail: string | null;
  internalContinuation?: boolean | undefined;
  isBackgroundWorker?: boolean | undefined;
};

function rateLimited(
  decision: Extract<RateDecision, { allowed: false }>,
  message: string,
) {
  return new HTTPError({
    status: 429,
    message,
    data: {
      errorCode: "RATE_LIMITED",
      scope: decision.scope,
      limit: decision.limit,
      retryAfterSeconds: decision.retryAfterSeconds,
    },
  });
}

export async function assertGuestTurnAllowed(details: TurnDetails) {
  const email = details.ownerEmail;
  if (!email || !isGuestEmail(email)) return;
  if (details.internalContinuation || details.isBackgroundWorker) return;
  const network = await takeRateSlot(
    GUEST_TURN_IP_RULE,
    clientIp(details.event),
  );
  if (!network.allowed) {
    throw rateLimited(
      network,
      network.scope === "key"
        ? "Too many demo messages from this network. Try again within the hour."
        : "The demo agent is busy right now. Try again later.",
    );
  }
  const guest = await takeRateSlot(GUEST_TURN_RULE, email.toLowerCase());
  if (!guest.allowed) {
    throw rateLimited(
      guest,
      `This demo sandbox has used its ${guest.limit} agent messages. Start a new demo to keep going.`,
    );
  }
}
