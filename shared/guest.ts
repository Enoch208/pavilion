export const GUEST_EMAIL_DOMAIN = "guest.pavilion.invalid";
export const GUEST_TTL_HOURS = 24;

const GUEST_BLOCKED_ROOTS = [
  "/home",
  "/database",
  "/observability",
  "/extensions",
  "/team",
  "/agent",
  "/settings",
];

export function isGuestEmail(email: string | null | undefined): boolean {
  return (
    typeof email === "string" &&
    email.toLowerCase().endsWith(`@${GUEST_EMAIL_DOMAIN}`)
  );
}

export function isGuestBlockedPath(pathname: string): boolean {
  return GUEST_BLOCKED_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}
