import { NOT_ADMIN_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Fallback user when no OAuth session exists (auth-free mode)
const FALLBACK_USER: User = {
  id: 1,
  openId: "default-local-user",
  name: "Local User",
  email: "user@prodiscovery.local",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Use context user if available, otherwise fall back to default user
  const user = ctx.user ?? FALLBACK_USER;

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const user = ctx.user ?? FALLBACK_USER;

    if (user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }),
);
