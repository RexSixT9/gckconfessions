import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const MONGODB_URI_DIRECT = process.env.MONGODB_URI_DIRECT?.trim() ?? "";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in environment variables.");
}

function isSrvDnsError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybe = error as {
    code?: string;
    syscall?: string;
    hostname?: string;
    message?: string;
    cause?: unknown;
  };

  const message = String(maybe.message ?? "").toLowerCase();
  const code = String(maybe.code ?? "").toLowerCase();
  const syscall = String(maybe.syscall ?? "").toLowerCase();
  const hostname = String(maybe.hostname ?? "").toLowerCase();

  const directMatch =
    syscall === "querysrv" ||
    hostname.includes("_mongodb._tcp") ||
    message.includes("querysrv") ||
    message.includes("_mongodb._tcp");

  if (directMatch) return true;

  if (code === "econnrefused" || code === "enotfound" || code === "etimedout" || code === "eai_again") {
    return message.includes("srv") || message.includes("dns");
  }

  if (maybe.cause) {
    return isSrvDnsError(maybe.cause);
  }

  return false;
}

function mongoOptions() {
  return {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
  };
}

function directUriConfigIssue(uri: string) {
  if (!uri) return "MONGODB_URI_DIRECT is empty.";

  const value = uri.trim();
  const normalized = value.toLowerCase();

  if (!normalized.startsWith("mongodb://")) {
    return "MONGODB_URI_DIRECT must start with mongodb:// and include real Atlas node hosts.";
  }

  if (/[<>]/.test(value)) {
    return "MONGODB_URI_DIRECT still contains placeholder markers like <...>.";
  }

  const placeholderTokens = ["host1", "host2", "host3", "username", "password", "database"];
  if (placeholderTokens.some((token) => normalized.includes(token))) {
    return "MONGODB_URI_DIRECT still contains template values (for example host1/username/password/database).";
  }

  return "";
}

function errorWithCause(message: string, cause: unknown) {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
}

let loggedDirectFallback = false;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };

global.mongoose = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        return await mongoose.connect(MONGODB_URI, mongoOptions());
      } catch (primaryError) {
        const canUseDirectFallback =
          MONGODB_URI.startsWith("mongodb+srv://") &&
          Boolean(MONGODB_URI_DIRECT) &&
          isSrvDnsError(primaryError);

        if (!canUseDirectFallback) {
          throw primaryError;
        }

        const directUriIssue = directUriConfigIssue(MONGODB_URI_DIRECT);
        if (directUriIssue) {
          throw errorWithCause(
            `MongoDB SRV DNS lookup failed and MONGODB_URI_DIRECT fallback is invalid: ${directUriIssue}`,
            primaryError
          );
        }

        if (!loggedDirectFallback) {
          loggedDirectFallback = true;
          console.warn("MongoDB SRV DNS lookup failed; retrying database connection with MONGODB_URI_DIRECT fallback.");
        }

        return mongoose.connect(MONGODB_URI_DIRECT, mongoOptions());
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise so the next call retries instead of reusing the rejected promise
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
