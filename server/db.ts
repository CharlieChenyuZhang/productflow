import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  projects, InsertProject, Project,
  dataFiles, InsertDataFile, DataFile,
  analyses, InsertAnalysis, Analysis,
  featureProposals, InsertFeatureProposal, FeatureProposal,
  tasks, InsertTask, Task,
  companyResearch, InsertCompanyResearch, CompanyResearch,
  researchFindings, InsertResearchFinding, ResearchFinding,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Projects ───
export async function createProject(data: InsertProject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result[0].insertId;
}

export async function getUserProjects(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return result[0];
}

export async function updateProject(projectId: number, userId: number, data: Partial<Pick<Project, "name" | "description" | "status">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function deleteProject(projectId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.projectId, projectId));
  await db.delete(featureProposals).where(eq(featureProposals.projectId, projectId));
  await db.delete(analyses).where(eq(analyses.projectId, projectId));
  await db.delete(dataFiles).where(eq(dataFiles.projectId, projectId));
  await db.delete(researchFindings).where(eq(researchFindings.projectId, projectId));
  await db.delete(companyResearch).where(eq(companyResearch.projectId, projectId));
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

// ─── Data Files ───
export async function createDataFile(data: InsertDataFile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataFiles).values(data);
  return result[0].insertId;
}

export async function getDataFileById(id: number, projectId: number): Promise<DataFile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dataFiles).where(and(eq(dataFiles.id, id), eq(dataFiles.projectId, projectId))).limit(1);
  return result[0];
}

export async function getProjectFiles(projectId: number): Promise<DataFile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataFiles).where(eq(dataFiles.projectId, projectId)).orderBy(desc(dataFiles.createdAt));
}

export async function deleteDataFile(fileId: number, projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dataFiles).where(and(eq(dataFiles.id, fileId), eq(dataFiles.projectId, projectId)));
}

// ─── Analyses ───
export async function createAnalysis(data: InsertAnalysis): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analyses).values(data);
  return result[0].insertId;
}

export async function getProjectAnalyses(projectId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analyses).where(eq(analyses.projectId, projectId)).orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(analysisId: number, projectId: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analyses).where(and(eq(analyses.id, analysisId), eq(analyses.projectId, projectId))).limit(1);
  return result[0];
}

export async function updateAnalysis(analysisId: number, data: Partial<Pick<Analysis, "status" | "themes" | "painPoints" | "featureRequests" | "sentimentSummary" | "rawAnalysis" | "completedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(analyses).set(data).where(eq(analyses.id, analysisId));
}

// ─── Feature Proposals ───
export async function createFeatureProposal(data: InsertFeatureProposal): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(featureProposals).values(data);
  return result[0].insertId;
}

export async function getProjectProposals(projectId: number): Promise<FeatureProposal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureProposals).where(eq(featureProposals.projectId, projectId)).orderBy(desc(featureProposals.createdAt));
}

export async function getProposalById(proposalId: number, projectId: number): Promise<FeatureProposal | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(featureProposals).where(and(eq(featureProposals.id, proposalId), eq(featureProposals.projectId, projectId))).limit(1);
  return result[0];
}

export async function updateProposalStatus(proposalId: number, status: FeatureProposal["status"]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(featureProposals).set({ status }).where(eq(featureProposals.id, proposalId));
}

// ─── Tasks ───
export async function createTask(data: InsertTask): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function createManyTasks(taskList: InsertTask[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (taskList.length === 0) return;
  await db.insert(tasks).values(taskList);
}

export async function getProposalTasks(featureProposalId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.featureProposalId, featureProposalId)).orderBy(tasks.sortOrder);
}

export async function getProjectTasks(projectId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(tasks.sortOrder);
}

export async function updateTaskStatus(taskId: number, status: Task["status"]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set({ status }).where(eq(tasks.id, taskId));
}

export async function deleteProposalTasks(featureProposalId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.featureProposalId, featureProposalId));
}

// ─── Company Research ───
export async function createCompanyResearch(data: InsertCompanyResearch): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companyResearch).values(data);
  return result[0].insertId;
}

export async function getProjectResearch(projectId: number): Promise<CompanyResearch[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyResearch).where(eq(companyResearch.projectId, projectId)).orderBy(desc(companyResearch.createdAt));
}

export async function getResearchById(researchId: number, projectId: number): Promise<CompanyResearch | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyResearch).where(and(eq(companyResearch.id, researchId), eq(companyResearch.projectId, projectId))).limit(1);
  return result[0];
}

export async function updateCompanyResearch(researchId: number, data: Partial<Omit<CompanyResearch, "id" | "createdAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companyResearch).set(data).where(eq(companyResearch.id, researchId));
}

export async function deleteCompanyResearch(researchId: number, projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(researchFindings).where(and(eq(researchFindings.researchId, researchId), eq(researchFindings.projectId, projectId)));
  await db.delete(companyResearch).where(and(eq(companyResearch.id, researchId), eq(companyResearch.projectId, projectId)));
}

export async function createManyFindings(findings: InsertResearchFinding[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (findings.length === 0) return;
  await db.insert(researchFindings).values(findings);
}

export async function getResearchFindings(researchId: number): Promise<ResearchFinding[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchFindings).where(eq(researchFindings.researchId, researchId)).orderBy(desc(researchFindings.createdAt));
}

// ─── Stats ───
export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) return { files: 0, analyses: 0, proposals: 0, tasks: 0, research: 0 };
  const [files, analysesList, proposalsList, tasksList] = await Promise.all([
    db.select().from(dataFiles).where(eq(dataFiles.projectId, projectId)),
    db.select().from(analyses).where(eq(analyses.projectId, projectId)),
    db.select().from(featureProposals).where(eq(featureProposals.projectId, projectId)),
    db.select().from(tasks).where(eq(tasks.projectId, projectId)),
  ]);
  const researchList = await db.select().from(companyResearch).where(eq(companyResearch.projectId, projectId));
  return {
    files: files.length,
    analyses: analysesList.length,
    proposals: proposalsList.length,
    tasks: tasksList.length,
    research: researchList.length,
  };
}
