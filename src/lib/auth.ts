import { SignJWT, jwtVerify } from "jose";
import { TOKEN_EXPIRATION } from "./constants";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables.");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type AdminTokenPayload = {
  sub: string;
  email: string;
  iat?: number;
};

export type AdminTokenErrorReason = "missing_auth" | "invalid_token" | "expired_token";

type VerifyAdminTokenResult =
  | { ok: true; payload: AdminTokenPayload }
  | { ok: false; reason: AdminTokenErrorReason };

export async function signAdminToken(payload: AdminTokenPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()            // adds `iat` — used for token invalidation checks
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secretKey);
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey, {
    algorithms: ["HS256"],
  });

  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    email: typeof payload.email === "string" ? payload.email : "",
    iat: typeof payload.iat === "number" ? payload.iat : 0,
  };
}

function classifyTokenError(error: unknown): Exclude<AdminTokenErrorReason, "missing_auth"> {
  if (!(error instanceof Error)) return "invalid_token";

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  if (name.includes("expired") || message.includes("exp") || message.includes("expired")) {
    return "expired_token";
  }

  return "invalid_token";
}

export async function verifyAdminTokenSafe(token: string | null | undefined): Promise<VerifyAdminTokenResult> {
  if (!token) {
    return { ok: false, reason: "missing_auth" };
  }

  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) {
      return { ok: false, reason: "invalid_token" };
    }

    return { ok: true, payload };
  } catch (error) {
    return { ok: false, reason: classifyTokenError(error) };
  }
}
