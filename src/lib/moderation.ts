import Filter from "bad-words";

const filter = new Filter();
export const SANITIZATION_POLICY_VERSION = "2026-03-19.v1";

export function sanitizeText(input: string, maxLength = 500) {
  let cleaned = input.replace(/<[^>]*>/g, "");
  cleaned = cleaned.replace(/\r/g, "");
  cleaned = cleaned.replace(/[\t ]+/g, " ").trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

export function normalizeForSimilarity(input: string, maxLength = 500) {
  const base = sanitizeText(input, maxLength).toLowerCase();
  return base
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(input: string) {
  const tokens = input.split(" ").filter((t) => t.length > 1);
  return new Set(tokens);
}

export function getTextSimilarityScore(a: string, b: string) {
  const left = normalizeForSimilarity(a);
  const right = normalizeForSimilarity(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const aSet = toTokenSet(left);
  const bSet = toTokenSet(right);
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }

  const union = aSet.size + bSet.size - intersection;
  if (union <= 0) return 0;
  return intersection / union;
}

export function sanitizeOutputText(input: string, maxLength = 500) {
  const truncated = String(input ?? "").slice(0, maxLength);
  return truncated.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function filterProfanity(text: string) {
  const clean = filter.clean(text);
  return { clean, hadProfanity: clean !== text };
}

export function validatePasswordPolicy(password: string) {
  const minLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}

type SubmissionValidationResult = {
  valid: boolean;
  error?: string;
};

const STRONG_TONE_WORDS = ["hate", "kill", "worthless", "stupid", "die"];

export function validateConfessionSubmission(rawMessage: string): SubmissionValidationResult {
  const message = String(rawMessage ?? "");

  if (!message.trim()) {
    return { valid: false, error: "Confession message is required." };
  }

  if (/\b\d{10,}\b/.test(message) || /@\w+\.\w+/.test(message) || /(https?:\/\/|www\.)/i.test(message)) {
    return {
      valid: false,
      error: "Please remove phone numbers, links, or personal identifiers.",
    };
  }

  const lower = message.toLowerCase();
  const toneHits = STRONG_TONE_WORDS.filter((word) => lower.includes(word)).length;
  if (toneHits >= 2) {
    return {
      valid: false,
      error: "Please soften hostile wording before submitting.",
    };
  }

  return { valid: true };
}
