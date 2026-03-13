import { readCsrfTokenFromDocumentCookie } from "@/lib/csrf";

export function getCsrfHeader() {
  if (typeof document === "undefined") {
    return {} as Record<string, string>;
  }

  const token = readCsrfTokenFromDocumentCookie(document.cookie);
  if (!token) {
    return {} as Record<string, string>;
  }

  return { "x-csrf-token": token };
}
