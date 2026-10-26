// Supabase's messages are written for developers; these are written for people.
// Unknown messages pass through unchanged so nothing is hidden.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check them, or reset your password.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Open the link we sent you, then sign in.";
  if (m.includes("user already registered")) return "An account already exists for this email. Sign in instead.";
  if (m.includes("password should be at least")) return "Use a password of at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute, then try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "We couldn't reach the server. Check your connection and try again.";
  return message;
}
