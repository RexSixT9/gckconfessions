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

export async function signAdminToken(payload: AdminTokenPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()            // adds `iat` — used for token invalidation checks
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secretKey);
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);

  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    email: typeof payload.email === "string" ? payload.email : "",
    iat: typeof payload.iat === "number" ? payload.iat : 0,
  };
}
