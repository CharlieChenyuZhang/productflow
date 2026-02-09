import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const dataFiles = mysqlTable("data_files", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileType: mysqlEnum("fileType", ["transcript", "usage_data"]).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataFile = typeof dataFiles.$inferSelect;
export type InsertDataFile = typeof dataFiles.$inferInsert;

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  themes: json("themes"),
  painPoints: json("painPoints"),
  featureRequests: json("featureRequests"),
  sentimentSummary: json("sentimentSummary"),
  rawAnalysis: text("rawAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

export const featureProposals = mysqlTable("feature_proposals", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  analysisId: int("analysisId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  problemStatement: text("problemStatement").notNull(),
  proposedSolution: text("proposedSolution").notNull(),
  uiChanges: text("uiChanges"),
  dataModelChanges: text("dataModelChanges"),
  workflowChanges: text("workflowChanges"),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  effort: mysqlEnum("effort", ["small", "medium", "large", "xlarge"]).default("medium").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "rejected", "in_progress", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureProposal = typeof featureProposals.$inferSelect;
export type InsertFeatureProposal = typeof featureProposals.$inferInsert;

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  featureProposalId: int("featureProposalId").notNull(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["frontend", "backend", "database", "api", "testing", "devops", "design"]).default("frontend").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  estimatedHours: int("estimatedHours"),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "done"]).default("todo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Company Research ───
export const companyResearch = mysqlTable("company_research", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  companyUrl: varchar("companyUrl", { length: 1024 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "searching", "analyzing", "completed", "failed"]).default("pending").notNull(),
  // Aggregated results
  overallSentiment: mysqlEnum("overallSentiment", ["positive", "negative", "neutral", "mixed"]),
  positiveCount: int("positiveCount").default(0),
  negativeCount: int("negativeCount").default(0),
  neutralCount: int("neutralCount").default(0),
  summary: text("summary"),
  keyStrengths: json("keyStrengths"),
  keyWeaknesses: json("keyWeaknesses"),
  recommendations: json("recommendations"),
  rawSearchResults: json("rawSearchResults"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CompanyResearch = typeof companyResearch.$inferSelect;
export type InsertCompanyResearch = typeof companyResearch.$inferInsert;

export const researchFindings = mysqlTable("research_findings", {
  id: int("id").autoincrement().primaryKey(),
  researchId: int("researchId").notNull(),
  projectId: int("projectId").notNull(),
  source: varchar("source", { length: 512 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["review", "forum", "social_media", "news", "blog", "support", "other"]).default("other").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral"]).default("neutral").notNull(),
  sentimentScore: int("sentimentScore"),
  category: varchar("category", { length: 255 }),
  tags: json("tags"),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchFinding = typeof researchFindings.$inferSelect;
export type InsertResearchFinding = typeof researchFindings.$inferInsert;
