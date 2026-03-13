import { CSRF_COOKIE_NAME } from "@/lib/constants";

function readCsrfTokenFromDocumentCookie(cookieText: string) {
  const cookie = cookieText
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!cookie) return "";
  return decodeURIComponent(cookie.slice(CSRF_COOKIE_NAME.length + 1));
}

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
