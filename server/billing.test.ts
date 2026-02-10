import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all external dependencies
vi.mock("./db", () => ({
  getUserProjects: vi.fn(),
  getProjectById: vi.fn(),
  getProjectStats: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectFiles: vi.fn(),
  createDataFile: vi.fn(),
  deleteDataFile: vi.fn(),
  getDataFileById: vi.fn(),
  getProjectAnalyses: vi.fn(),
  getAnalysisById: vi.fn(),
  createAnalysis: vi.fn(),
  updateAnalysis: vi.fn(),
  getProjectProposals: vi.fn(),
  getProposalById: vi.fn(),
  createFeatureProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  getProposalTasks: vi.fn(),
  getProjectTasks: vi.fn(),
  createManyTasks: vi.fn(),
  deleteProposalTasks: vi.fn(),
  updateTaskStatus: vi.fn(),
  createCompanyResearch: vi.fn(),
  getProjectResearch: vi.fn(),
  getResearchById: vi.fn(),
  updateCompanyResearch: vi.fn(),
  deleteCompanyResearch: vi.fn(),
  createManyFindings: vi.fn(),
  getResearchFindings: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.txt", key: "test-key" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./stripe", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
  createBillingPortalSession: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/portal" }),
  createStripeProducts: vi.fn().mockResolvedValue({
    proMonthly: "price_pro_monthly_123",
    proYearly: "price_pro_yearly_123",
    teamMonthly: "price_team_monthly_123",
    teamYearly: "price_team_yearly_123",
  }),
  getStripe: vi.fn(),
  getSubscription: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginCount: 1,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    planId: "free",
    planPeriodEnd: null,
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Billing Plans ───
describe("billing.plans", () => {
  it("returns all pricing plans (public endpoint)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.plans();

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("free");
    expect(result[1].id).toBe("pro");
    expect(result[2].id).toBe("team");
  });

  it("includes correct pricing for each plan", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.plans();

    expect(result[0].monthlyPrice).toBe(0);
    expect(result[1].monthlyPrice).toBe(4900);
    expect(result[2].monthlyPrice).toBe(12900);
  });

  it("includes limits for each plan", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.plans();

    // Free plan limits
    expect(result[0].limits.maxProjects).toBe(2);
    expect(result[0].limits.maxAnalysesPerMonth).toBe(3);
    expect(result[0].limits.maxResearchPerMonth).toBe(1);

    // Pro plan limits
    expect(result[1].limits.maxProjects).toBe(-1); // unlimited
    expect(result[1].limits.maxAnalysesPerMonth).toBe(50);

    // Team plan limits
    expect(result[2].limits.maxProjects).toBe(-1);
    expect(result[2].limits.maxAnalysesPerMonth).toBe(-1); // unlimited
  });

  it("marks Pro as highlighted", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.plans();

    expect(result[0].highlighted).toBe(false);
    expect(result[1].highlighted).toBe(true);
    expect(result[2].highlighted).toBe(false);
  });
});

// ─── Current Plan ───
describe("billing.currentPlan", () => {
  it("returns free plan for user without subscription", async () => {
    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.currentPlan();

    expect(result.planId).toBe("free");
    expect(result.planName).toBe("Starter");
    expect(result.stripeCustomerId).toBeNull();
    expect(result.stripeSubscriptionId).toBeNull();
  });

  it("returns pro plan for subscribed user", async () => {
    const ctx = createAuthContext({
      planId: "pro",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      planPeriodEnd: new Date("2026-03-01"),
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.currentPlan();

    expect(result.planId).toBe("pro");
    expect(result.planName).toBe("Pro");
    expect(result.stripeCustomerId).toBe("cus_123");
    expect(result.stripeSubscriptionId).toBe("sub_456");
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.billing.currentPlan()).rejects.toThrow("You must be logged in");
  });
});

// ─── Checkout ───
describe("billing.checkout", () => {
  it("creates a checkout session for pro plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.checkout({
      planId: "pro",
      interval: "monthly",
      origin: "https://example.com",
    });

    expect(result.url).toBe("https://checkout.stripe.com/test");
  });

  it("creates a checkout session for team plan", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.checkout({
      planId: "team",
      interval: "yearly",
      origin: "https://example.com",
    });

    expect(result.url).toBe("https://checkout.stripe.com/test");
  });

  it("requires authentication for checkout", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.billing.checkout({
        planId: "pro",
        interval: "monthly",
        origin: "https://example.com",
      })
    ).rejects.toThrow("You must be logged in");
  });

  it("rejects invalid plan id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.billing.checkout({
        planId: "invalid" as any,
        interval: "monthly",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });
});

// ─── Usage ───
describe("billing.usage", () => {
  it("returns usage counts for the current month", async () => {
    const now = new Date();
    vi.mocked(db.getUserProjects).mockResolvedValue([
      { id: 1, userId: 1, name: "P1" } as any,
    ]);
    vi.mocked(db.getProjectAnalyses).mockResolvedValue([
      { id: 1, createdAt: now } as any,
      { id: 2, createdAt: now } as any,
    ]);
    vi.mocked(db.getProjectResearch).mockResolvedValue([
      { id: 1, createdAt: now } as any,
    ]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.usage();

    expect(result.projects).toBe(1);
    expect(result.analysesThisMonth).toBe(2);
    expect(result.researchThisMonth).toBe(1);
  });

  it("excludes analyses from previous months", async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const now = new Date();

    vi.mocked(db.getUserProjects).mockResolvedValue([
      { id: 1, userId: 1, name: "P1" } as any,
    ]);
    vi.mocked(db.getProjectAnalyses).mockResolvedValue([
      { id: 1, createdAt: lastMonth } as any,
      { id: 2, createdAt: now } as any,
    ]);
    vi.mocked(db.getProjectResearch).mockResolvedValue([]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.usage();

    expect(result.analysesThisMonth).toBe(1);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.billing.usage()).rejects.toThrow("You must be logged in");
  });
});

// ─── Portal ───
describe("billing.portal", () => {
  it("creates a billing portal session", async () => {
    const ctx = createAuthContext({
      stripeCustomerId: "cus_123",
      planId: "pro",
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.billing.portal({ origin: "https://example.com" });

    expect(result.url).toBe("https://billing.stripe.com/portal");
  });

  it("throws when no stripe customer id", async () => {
    const ctx = createAuthContext({ stripeCustomerId: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.billing.portal({ origin: "https://example.com" })
    ).rejects.toThrow("No billing account found");
  });
});

// ─── Usage Limit Enforcement ───
describe("project.create with usage limits", () => {
  it("allows project creation within free plan limit", async () => {
    vi.mocked(db.getUserProjects).mockResolvedValue([
      { id: 1, userId: 1, name: "P1" } as any,
    ]);
    vi.mocked(db.createProject).mockResolvedValue(2);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.create({ name: "New Project" });

    expect(result).toEqual({ id: 2 });
  });

  it("blocks project creation when free plan limit reached", async () => {
    vi.mocked(db.getUserProjects).mockResolvedValue([
      { id: 1, userId: 1, name: "P1" } as any,
      { id: 2, userId: 1, name: "P2" } as any,
    ]);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.project.create({ name: "Third Project" })
    ).rejects.toThrow("Project limit reached");
  });

  it("allows unlimited projects on pro plan", async () => {
    vi.mocked(db.getUserProjects).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: i + 1, userId: 1, name: `P${i + 1}` } as any))
    );
    vi.mocked(db.createProject).mockResolvedValue(11);

    const ctx = createAuthContext({ planId: "pro" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.create({ name: "Another Project" });

    expect(result).toEqual({ id: 11 });
  });
});

describe("analysis.run with usage limits", () => {
  it("blocks analysis when monthly limit reached on free plan", async () => {
    const now = new Date();
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getProjectFiles).mockResolvedValue([{ id: 1, fileName: "test.txt" }] as any);
    vi.mocked(db.getUserProjects).mockResolvedValue([{ id: 1, userId: 1 } as any]);
    vi.mocked(db.getProjectAnalyses).mockResolvedValue([
      { id: 1, createdAt: now } as any,
      { id: 2, createdAt: now } as any,
      { id: 3, createdAt: now } as any,
    ]);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analysis.run({ projectId: 1 })).rejects.toThrow("Analysis limit reached");
  });

  it("allows analysis within free plan limit", async () => {
    const now = new Date();
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getProjectFiles).mockResolvedValue([{ id: 1, fileName: "test.txt" }] as any);
    vi.mocked(db.getUserProjects).mockResolvedValue([{ id: 1, userId: 1 } as any]);
    vi.mocked(db.getProjectAnalyses).mockResolvedValue([
      { id: 1, createdAt: now } as any,
    ]);
    vi.mocked(db.createAnalysis).mockResolvedValue(2);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analysis.run({ projectId: 1 });

    expect(result).toEqual({ id: 2 });
  });
});

describe("research.start with usage limits", () => {
  it("blocks research when monthly limit reached on free plan", async () => {
    const now = new Date();
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getUserProjects).mockResolvedValue([{ id: 1, userId: 1 } as any]);
    vi.mocked(db.getProjectResearch).mockResolvedValue([
      { id: 1, createdAt: now } as any,
    ]);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.research.start({ projectId: 1, companyUrl: "stripe.com" })
    ).rejects.toThrow("Research limit reached");
  });

  it("allows research within free plan limit", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getUserProjects).mockResolvedValue([{ id: 1, userId: 1 } as any]);
    vi.mocked(db.getProjectResearch).mockResolvedValue([]);
    vi.mocked(db.createCompanyResearch).mockResolvedValue(1);

    const ctx = createAuthContext({ planId: "free" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.start({ projectId: 1, companyUrl: "stripe.com" });

    expect(result).toEqual({ id: 1 });
  });

  it("allows unlimited research on team plan", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getUserProjects).mockResolvedValue([{ id: 1, userId: 1 } as any]);
    vi.mocked(db.getProjectResearch).mockResolvedValue(
      Array.from({ length: 50 }, (_, i) => ({ id: i + 1, createdAt: new Date() } as any))
    );
    vi.mocked(db.createCompanyResearch).mockResolvedValue(51);

    const ctx = createAuthContext({ planId: "team" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.start({ projectId: 1, companyUrl: "stripe.com" });

    expect(result).toEqual({ id: 51 });
  });
});
