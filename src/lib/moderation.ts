import Filter from "bad-words";

const filter = new Filter();

export function sanitizeText(input: string, maxLength = 500) {
  let cleaned = input.replace(/<[^>]*>/g, "");
  cleaned = cleaned.replace(/\r/g, "");
  cleaned = cleaned.replace(/[\t ]+/g, " ").trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
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
