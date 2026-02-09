import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const DEFAULT_OPEN_ID = "default-local-user";

async function getOrCreateDefaultUser(): Promise<User | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const existing = await db.select().from(users).where(eq(users.openId, DEFAULT_OPEN_ID)).limit(1);
    if (existing.length > 0) return existing[0];

    await db.insert(users).values({
      openId: DEFAULT_OPEN_ID,
      name: "Local User",
      email: "user@prodiscovery.local",
      loginMethod: "local",
      role: "admin",
    });

    const created = await db.select().from(users).where(eq(users.openId, DEFAULT_OPEN_ID)).limit(1);
    return created[0] ?? null;
  } catch (error) {
    console.warn("[Context] Failed to get/create default user:", error);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional - fall back to default user
    user = null;
  }

  // If no OAuth user, use default local user
  if (!user) {
    user = await getOrCreateDefaultUser();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
