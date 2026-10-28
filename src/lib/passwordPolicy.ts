/**
 * Password rules, shared by the forms (live hint) and the server (zod).
 * Length is what matters: at least 12 characters, no composition rules, and
 * long passphrases welcome. bcrypt (used by Supabase Auth) only reads the
 * first 72 bytes, so that's the ceiling.
 * Mirror the minimum in Supabase → Authentication → Providers → Email.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 72;

export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

// A short list of the most common long passwords. Not a substitute for
// Supabase's leaked-password check (Pro plan), just the obvious ones.
const COMMON_PASSWORDS = new Set([
  "123456789012",
  "1234567890123",
  "12345678910",
  "qwertyuiopas",
  "qwertyuiop123",
  "password1234",
  "password12345",
  "passwordpassword",
  "iloveyou1234",
  "abcdefghijkl",
  "abc123abc123",
  "letmein12345",
  "welcome12345",
  "administrator",
  "stickerquest",
  "stickerquest1",
  "stickerquest123",
]);

/** True for passwords that are long enough but trivially guessable. */
export function isTriviallyWeak(password: string): boolean {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  // One character repeated, e.g. "aaaaaaaaaaaa".
  if (/^(.)\1+$/.test(password)) return true;
  // A short chunk repeated, e.g. "abcabcabcabc".
  if (/^(.{1,4})\1+$/.test(password)) return true;
  return false;
}

export type PasswordStrength = {
  /** 0 = too short / unusable, 1 = okay, 2 = good, 3 = great. */
  score: 0 | 1 | 2 | 3;
  label: string;
  hint: string;
};

/** A friendly, length-led strength hint for the password field. */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { score: 0, label: "", hint: `Use at least ${PASSWORD_MIN_LENGTH} characters. A short phrase works great.` };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    const left = PASSWORD_MIN_LENGTH - password.length;
    return { score: 0, label: "Too short", hint: `${left} more character${left === 1 ? "" : "s"} to go.` };
  }
  if (passwordByteLength(password) > PASSWORD_MAX_BYTES) {
    return { score: 0, label: "Too long", hint: `Keep it under ${PASSWORD_MAX_BYTES} characters.` };
  }
  if (isTriviallyWeak(password)) {
    return { score: 0, label: "Too easy to guess", hint: "Try a few random words strung together." };
  }

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const words = password.trim().split(/[\s\-_.]+/).filter(Boolean).length;

  if (password.length >= 20 || (password.length >= 16 && (variety >= 3 || words >= 3))) {
    return { score: 3, label: "Great", hint: "That's a strong one." };
  }
  if (password.length >= 16 || variety >= 3) {
    return { score: 2, label: "Good", hint: "Nice. A few more characters makes it even stronger." };
  }
  return { score: 1, label: "Okay", hint: "Longer is stronger. Try adding another word." };
}
