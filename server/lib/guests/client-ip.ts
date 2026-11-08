import { createHash } from "node:crypto";

import { getRequestIP, type H3Event } from "h3";

const PROXY_IP_HEADER = "x-real-ip";

export function clientIp(event: H3Event): string {
  if (process.env.NODE_ENV === "production") {
    const forwarded = event.req.headers.get(PROXY_IP_HEADER)?.trim();
    if (forwarded) return forwarded;
  }
  return getRequestIP(event) ?? "unknown";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`pavilion-ip:${ip}`).digest("hex");
}
