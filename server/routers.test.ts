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
  // Company Research
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

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
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

// ─── Project CRUD ───
describe("project.list", () => {
  it("returns projects for authenticated user", async () => {
    const mockProjects = [
      { id: 1, userId: 1, name: "Test Project", description: null, status: "active", createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(db.getUserProjects).mockResolvedValue(mockProjects as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.list();

    expect(result).toEqual(mockProjects);
    expect(db.getUserProjects).toHaveBeenCalledWith(1);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.project.list()).rejects.toThrow();
  });
});

describe("project.create", () => {
  it("creates a project and returns id", async () => {
    vi.mocked(db.createProject).mockResolvedValue(42);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.create({ name: "New Project", description: "A test project" });

    expect(result).toEqual({ id: 42 });
    expect(db.createProject).toHaveBeenCalledWith({
      userId: 1,
      name: "New Project",
      description: "A test project",
    });
  });

  it("rejects empty project name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.project.create({ name: "" })).rejects.toThrow();
  });
});

describe("project.get", () => {
  it("returns project when found", async () => {
    const mockProject = { id: 1, userId: 1, name: "Test", description: null, status: "active", createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(db.getProjectById).mockResolvedValue(mockProject as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.get({ id: 1 });

    expect(result).toEqual(mockProject);
  });

  it("throws when project not found", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue(null);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.project.get({ id: 999 })).rejects.toThrow("Project not found");
  });
});

describe("project.delete", () => {
  it("deletes a project successfully", async () => {
    vi.mocked(db.deleteProject).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.project.delete({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(db.deleteProject).toHaveBeenCalledWith(1, 1);
  });
});

// ─── Data Files ───
describe("dataFile.list", () => {
  it("returns files for a project", async () => {
    const mockFiles = [
      { id: 1, projectId: 1, fileName: "interview.txt", fileType: "transcript" },
    ];
    vi.mocked(db.getProjectFiles).mockResolvedValue(mockFiles as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dataFile.list({ projectId: 1 });

    expect(result).toEqual(mockFiles);
  });
});

describe("dataFile.upload", () => {
  it("uploads a file to S3 and stores metadata", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1 } as any);
    vi.mocked(db.createDataFile).mockResolvedValue(10);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dataFile.upload({
      projectId: 1,
      fileName: "test.txt",
      fileType: "transcript",
      content: Buffer.from("hello world").toString("base64"),
      mimeType: "text/plain",
    });

    expect(result.id).toBe(10);
    expect(result.url).toBe("https://s3.example.com/file.txt");
    expect(db.createDataFile).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1,
        userId: 1,
        fileName: "test.txt",
        fileType: "transcript",
        mimeType: "text/plain",
      })
    );
  });

  it("throws when project not found", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue(null);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dataFile.upload({
        projectId: 999,
        fileName: "test.txt",
        fileType: "transcript",
        content: "aGVsbG8=",
        mimeType: "text/plain",
      })
    ).rejects.toThrow("Project not found");
  });
});

// ─── Analysis ───
describe("analysis.list", () => {
  it("returns analyses for a project", async () => {
    const mockAnalyses = [{ id: 1, projectId: 1, status: "completed" }];
    vi.mocked(db.getProjectAnalyses).mockResolvedValue(mockAnalyses as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analysis.list({ projectId: 1 });

    expect(result).toEqual(mockAnalyses);
  });
});

describe("analysis.run", () => {
  it("creates an analysis and returns id", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getProjectFiles).mockResolvedValue([
      { id: 1, fileName: "test.txt", fileType: "transcript", fileUrl: "https://example.com/test.txt" },
    ] as any);
    vi.mocked(db.createAnalysis).mockResolvedValue(5);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analysis.run({ projectId: 1 });

    expect(result).toEqual({ id: 5 });
    expect(db.createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1,
        userId: 1,
        status: "processing",
      })
    );
  });

  it("throws when no files uploaded", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.getProjectFiles).mockResolvedValue([]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analysis.run({ projectId: 1 })).rejects.toThrow(
      "No data files uploaded"
    );
  });
});

// ─── Proposals ───
describe("proposal.list", () => {
  it("returns proposals for a project", async () => {
    const mockProposals = [{ id: 1, title: "Feature A", priority: "high" }];
    vi.mocked(db.getProjectProposals).mockResolvedValue(mockProposals as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.proposal.list({ projectId: 1 });

    expect(result).toEqual(mockProposals);
  });
});

describe("proposal.updateStatus", () => {
  it("updates proposal status", async () => {
    vi.mocked(db.updateProposalStatus).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.proposal.updateStatus({ id: 1, status: "approved" });

    expect(result).toEqual({ success: true });
    expect(db.updateProposalStatus).toHaveBeenCalledWith(1, "approved");
  });
});

// ─── Tasks ───
describe("task.listByProject", () => {
  it("returns tasks for a project", async () => {
    const mockTasks = [{ id: 1, title: "Task 1", category: "frontend" }];
    vi.mocked(db.getProjectTasks).mockResolvedValue(mockTasks as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.task.listByProject({ projectId: 1 });

    expect(result).toEqual(mockTasks);
  });
});

describe("task.listByProposal", () => {
  it("returns tasks for a proposal", async () => {
    const mockTasks = [{ id: 1, title: "Task 1", featureProposalId: 1 }];
    vi.mocked(db.getProposalTasks).mockResolvedValue(mockTasks as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.task.listByProposal({ featureProposalId: 1 });

    expect(result).toEqual(mockTasks);
  });
});

describe("task.updateStatus", () => {
  it("updates task status", async () => {
    vi.mocked(db.updateTaskStatus).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.task.updateStatus({ id: 1, status: "done" });

    expect(result).toEqual({ success: true });
    expect(db.updateTaskStatus).toHaveBeenCalledWith(1, "done");
  });
});

// ─── Company Research ───
describe("research.list", () => {
  it("returns research for a project", async () => {
    const mockResearch = [
      { id: 1, projectId: 1, companyUrl: "https://stripe.com", status: "completed" },
    ];
    vi.mocked(db.getProjectResearch).mockResolvedValue(mockResearch as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.list({ projectId: 1 });

    expect(result).toEqual(mockResearch);
    expect(db.getProjectResearch).toHaveBeenCalledWith(1);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.research.list({ projectId: 1 })).rejects.toThrow();
  });
});

describe("research.get", () => {
  it("returns research by id", async () => {
    const mockResearch = { id: 1, projectId: 1, companyUrl: "https://stripe.com", status: "completed" };
    vi.mocked(db.getResearchById).mockResolvedValue(mockResearch as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.get({ id: 1, projectId: 1 });

    expect(result).toEqual(mockResearch);
    expect(db.getResearchById).toHaveBeenCalledWith(1, 1);
  });
});

describe("research.getFindings", () => {
  it("returns findings for a research", async () => {
    const mockFindings = [
      { id: 1, researchId: 1, title: "Great product", sentiment: "positive" },
      { id: 2, researchId: 1, title: "Too expensive", sentiment: "negative" },
    ];
    vi.mocked(db.getResearchFindings).mockResolvedValue(mockFindings as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.getFindings({ researchId: 1 });

    expect(result).toEqual(mockFindings);
    expect(db.getResearchFindings).toHaveBeenCalledWith(1);
  });
});

describe("research.start", () => {
  it("creates research and starts async processing", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test Project" } as any);
    vi.mocked(db.createCompanyResearch).mockResolvedValue(7);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.start({
      projectId: 1,
      companyUrl: "stripe.com",
    });

    expect(result).toEqual({ id: 7 });
    expect(db.createCompanyResearch).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1,
        userId: 1,
        companyUrl: "https://stripe.com",
        status: "searching",
      })
    );
  });

  it("normalizes URLs without protocol", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.createCompanyResearch).mockResolvedValue(8);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.research.start({ projectId: 1, companyUrl: "notion.so" });

    expect(db.createCompanyResearch).toHaveBeenCalledWith(
      expect.objectContaining({
        companyUrl: "https://notion.so",
      })
    );
  });

  it("preserves URLs with protocol", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue({ id: 1, userId: 1, name: "Test" } as any);
    vi.mocked(db.createCompanyResearch).mockResolvedValue(9);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.research.start({ projectId: 1, companyUrl: "https://figma.com" });

    expect(db.createCompanyResearch).toHaveBeenCalledWith(
      expect.objectContaining({
        companyUrl: "https://figma.com",
      })
    );
  });

  it("throws when project not found", async () => {
    vi.mocked(db.getProjectById).mockResolvedValue(null);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.research.start({ projectId: 999, companyUrl: "stripe.com" })
    ).rejects.toThrow("Project not found");
  });

  it("rejects empty URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.research.start({ projectId: 1, companyUrl: "" })
    ).rejects.toThrow();
  });
});

describe("research.delete", () => {
  it("deletes research and findings", async () => {
    vi.mocked(db.deleteCompanyResearch).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.research.delete({ id: 1, projectId: 1 });

    expect(result).toEqual({ success: true });
    expect(db.deleteCompanyResearch).toHaveBeenCalledWith(1, 1);
  });
});

// ─── Auth ───
describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeTruthy();
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
