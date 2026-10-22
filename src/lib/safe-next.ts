/** Only allow post-sign-in redirects back into the organizer area (no open redirects). */
export function safeNext(next: string | undefined): string {
  return next && /^\/admin(\/|$|\?)/.test(next) ? next : "/admin";
}
