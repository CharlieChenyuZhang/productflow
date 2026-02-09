import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  project: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserProjects(ctx.user.id)),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id, ctx.user.id);
        if (!project) throw new Error("Project not found");
        return project;
      }),
    getStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => db.getProjectStats(input.projectId)),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createProject({ userId: ctx.user.id, name: input.name, description: input.description ?? null });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(255).optional(), description: z.string().optional(), status: z.enum(["active", "archived"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  dataFile: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectFiles(input.projectId)),
    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileType: z.enum(["transcript", "usage_data"]),
        content: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");
        const suffix = nanoid(8);
        const fileKey = `projects/${input.projectId}/files/${suffix}-${input.fileName}`;
        const buffer = Buffer.from(input.content, "base64");
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const id = await db.createDataFile({
          projectId: input.projectId,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileType: input.fileType,
          fileKey,
          fileUrl: url,
          fileSize: buffer.length,
          mimeType: input.mimeType,
        });
        return { id, url };
      }),
    getContent: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .query(async ({ input }) => {
        const file = await db.getDataFileById(input.id, input.projectId);
        if (!file) throw new Error("File not found");
        // Fetch the file content from S3 URL
        try {
          const response = await fetch(file.fileUrl);
          if (!response.ok) throw new Error("Failed to fetch file from storage");
          const text = await response.text();
          return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            content: text,
          };
        } catch (err) {
          console.error("[FileContent] Failed to fetch:", err);
          throw new Error("Could not retrieve file content");
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDataFile(input.id, input.projectId);
        return { success: true };
      }),
  }),

  analysis: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectAnalyses(input.projectId)),
    get: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .query(({ input }) => db.getAnalysisById(input.id, input.projectId)),
    run: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");
        const files = await db.getProjectFiles(input.projectId);
        if (files.length === 0) throw new Error("No data files uploaded. Please upload customer feedback data first.");

        const analysisId = await db.createAnalysis({
          projectId: input.projectId,
          userId: ctx.user.id,
          status: "processing",
        });

        // Run analysis asynchronously
        runAnalysis(analysisId, input.projectId, files, project.name).catch(err => {
          console.error("[Analysis] Failed:", err);
          db.updateAnalysis(analysisId, { status: "failed" });
        });

        return { id: analysisId };
      }),
  }),

  proposal: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectProposals(input.projectId)),
    get: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .query(({ input }) => db.getProposalById(input.id, input.projectId)),
    generate: protectedProcedure
      .input(z.object({ projectId: z.number(), analysisId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.analysisId, input.projectId);
        if (!analysis) throw new Error("Analysis not found");
        if (analysis.status !== "completed") throw new Error("Analysis is not completed yet");

        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");

        const proposals = await generateFeatureProposals(analysis, project.name);

        const ids: number[] = [];
        for (const p of proposals) {
          const id = await db.createFeatureProposal({
            projectId: input.projectId,
            analysisId: input.analysisId,
            userId: ctx.user.id,
            title: p.title,
            problemStatement: p.problemStatement,
            proposedSolution: p.proposedSolution,
            uiChanges: p.uiChanges || null,
            dataModelChanges: p.dataModelChanges || null,
            workflowChanges: p.workflowChanges || null,
            priority: p.priority as any,
            effort: p.effort as any,
          });
          ids.push(id);
        }

        notifyOwner({
          title: `New Feature Proposals Generated - ${project.name}`,
          content: `${proposals.length} feature proposals have been generated from the latest analysis of "${project.name}". Review them to decide what to build next.`,
        }).catch(() => {});

        return { ids, count: proposals.length };
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["draft", "approved", "rejected", "in_progress", "completed"]) }))
      .mutation(async ({ input }) => {
        await db.updateProposalStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  task: router({
    listByProposal: protectedProcedure
      .input(z.object({ featureProposalId: z.number() }))
      .query(({ input }) => db.getProposalTasks(input.featureProposalId)),
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectTasks(input.projectId)),
    generate: protectedProcedure
      .input(z.object({ featureProposalId: z.number(), projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const proposal = await db.getProposalById(input.featureProposalId, input.projectId);
        if (!proposal) throw new Error("Feature proposal not found");

        // Clear existing tasks for this proposal
        await db.deleteProposalTasks(input.featureProposalId);

        const generatedTasks = await generateTasks(proposal);
        const taskData = generatedTasks.map((t: any, i: number) => ({
          featureProposalId: input.featureProposalId,
          projectId: input.projectId,
          userId: ctx.user.id,
          title: t.title,
          description: t.description || null,
          category: t.category as any,
          priority: t.priority as any,
          estimatedHours: t.estimatedHours || null,
          sortOrder: i,
        }));

        await db.createManyTasks(taskData);
        return { count: taskData.length };
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["todo", "in_progress", "done"]) }))
      .mutation(async ({ input }) => {
        await db.updateTaskStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  research: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectResearch(input.projectId)),
    get: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .query(({ input }) => db.getResearchById(input.id, input.projectId)),
    getFindings: protectedProcedure
      .input(z.object({ researchId: z.number() }))
      .query(({ input }) => db.getResearchFindings(input.researchId)),
    start: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        companyUrl: z.string().min(1).max(1024),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId, ctx.user.id);
        if (!project) throw new Error("Project not found");

        // Normalize URL
        let url = input.companyUrl.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }

        const researchId = await db.createCompanyResearch({
          projectId: input.projectId,
          userId: ctx.user.id,
          companyUrl: url,
          status: "searching",
        });

        // Run research asynchronously
        runCompanyResearch(researchId, input.projectId, url, project.name).catch((err: any) => {
          console.error("[Research] Failed:", err);
          db.updateCompanyResearch(researchId, { status: "failed" });
        });

        return { id: researchId };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number(), projectId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompanyResearch(input.id, input.projectId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── AI Analysis Logic ───
async function runAnalysis(analysisId: number, projectId: number, files: any[], projectName: string) {
  try {
    // Fetch file contents
    const fileContents: string[] = [];
    for (const file of files) {
      try {
        const response = await fetch(file.fileUrl);
        const text = await response.text();
        fileContents.push(`--- File: ${file.fileName} (${file.fileType}) ---\n${text.slice(0, 15000)}`);
      } catch {
        fileContents.push(`--- File: ${file.fileName} (${file.fileType}) --- [Could not fetch content]`);
      }
    }

    const combinedContent = fileContents.join("\n\n");

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert product analyst. Analyze the following customer feedback data and product usage data for the product "${projectName}". Extract key insights and return a structured JSON response.

You MUST return valid JSON matching this exact schema:
{
  "themes": [{"name": "string", "description": "string", "frequency": number, "sentiment": "positive"|"negative"|"neutral"|"mixed"}],
  "painPoints": [{"title": "string", "description": "string", "severity": "critical"|"high"|"medium"|"low", "frequency": number}],
  "featureRequests": [{"title": "string", "description": "string", "requestCount": number, "priority": "critical"|"high"|"medium"|"low"}],
  "sentimentSummary": {"overall": "positive"|"negative"|"neutral"|"mixed", "positivePercent": number, "negativePercent": number, "neutralPercent": number, "highlights": ["string"]}
}

- "frequency" and "requestCount" should be numbers from 1-100 representing relative frequency
- Include 3-8 items per category
- Be specific and actionable in descriptions
- Base everything on the actual data provided`
        },
        {
          role: "user",
          content: `Here is the customer feedback and usage data to analyze:\n\n${combinedContent}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analysis_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              themes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    frequency: { type: "number" },
                    sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] }
                  },
                  required: ["name", "description", "frequency", "sentiment"],
                  additionalProperties: false
                }
              },
              painPoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    frequency: { type: "number" }
                  },
                  required: ["title", "description", "severity", "frequency"],
                  additionalProperties: false
                }
              },
              featureRequests: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    requestCount: { type: "number" },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] }
                  },
                  required: ["title", "description", "requestCount", "priority"],
                  additionalProperties: false
                }
              },
              sentimentSummary: {
                type: "object",
                properties: {
                  overall: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
                  positivePercent: { type: "number" },
                  negativePercent: { type: "number" },
                  neutralPercent: { type: "number" },
                  highlights: { type: "array", items: { type: "string" } }
                },
                required: ["overall", "positivePercent", "negativePercent", "neutralPercent", "highlights"],
                additionalProperties: false
              }
            },
            required: ["themes", "painPoints", "featureRequests", "sentimentSummary"],
            additionalProperties: false
          }
        }
      }
    });

    const content = result.choices[0]?.message?.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : null;

    if (!parsed) throw new Error("Failed to parse LLM response");

    await db.updateAnalysis(analysisId, {
      status: "completed",
      themes: parsed.themes,
      painPoints: parsed.painPoints,
      featureRequests: parsed.featureRequests,
      sentimentSummary: parsed.sentimentSummary,
      rawAnalysis: typeof content === "string" ? content : JSON.stringify(content),
      completedAt: new Date(),
    });

    notifyOwner({
      title: `Analysis Complete - ${projectName}`,
      content: `Customer feedback analysis for "${projectName}" is complete. Found ${parsed.themes?.length || 0} themes, ${parsed.painPoints?.length || 0} pain points, and ${parsed.featureRequests?.length || 0} feature requests.`,
    }).catch(() => {});

  } catch (error) {
    console.error("[Analysis] Error:", error);
    await db.updateAnalysis(analysisId, { status: "failed" });
    throw error;
  }
}

// ─── Feature Proposal Generation ───
async function generateFeatureProposals(analysis: any, projectName: string) {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert product manager. Based on the analysis data for "${projectName}", generate 2-4 detailed feature proposals. Each proposal should address the most impactful pain points and feature requests.

Return valid JSON matching this schema:
{
  "proposals": [{
    "title": "string",
    "problemStatement": "string (2-3 paragraphs explaining the problem based on customer feedback)",
    "proposedSolution": "string (2-3 paragraphs describing the solution)",
    "uiChanges": "string (specific UI changes needed)",
    "dataModelChanges": "string (database/data model changes needed)",
    "workflowChanges": "string (workflow/process changes needed)",
    "priority": "critical"|"high"|"medium"|"low",
    "effort": "small"|"medium"|"large"|"xlarge"
  }]
}

Be specific and actionable. Reference actual customer feedback themes and pain points.`
      },
      {
        role: "user",
        content: `Analysis data:\nThemes: ${JSON.stringify(analysis.themes)}\nPain Points: ${JSON.stringify(analysis.painPoints)}\nFeature Requests: ${JSON.stringify(analysis.featureRequests)}\nSentiment: ${JSON.stringify(analysis.sentimentSummary)}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "feature_proposals",
        strict: true,
        schema: {
          type: "object",
          properties: {
            proposals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  problemStatement: { type: "string" },
                  proposedSolution: { type: "string" },
                  uiChanges: { type: "string" },
                  dataModelChanges: { type: "string" },
                  workflowChanges: { type: "string" },
                  priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  effort: { type: "string", enum: ["small", "medium", "large", "xlarge"] }
                },
                required: ["title", "problemStatement", "proposedSolution", "uiChanges", "dataModelChanges", "workflowChanges", "priority", "effort"],
                additionalProperties: false
              }
            }
          },
          required: ["proposals"],
          additionalProperties: false
        }
      }
    }
  });

  const content = result.choices[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : null;
  return parsed?.proposals || [];
}

// ─── Task Generation ───
async function generateTasks(proposal: any) {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a senior technical lead. Break down the following feature proposal into specific, actionable development tasks suitable for a coding agent or development team.

Return valid JSON matching this schema:
{
  "tasks": [{
    "title": "string (clear, concise task title)",
    "description": "string (detailed description with acceptance criteria)",
    "category": "frontend"|"backend"|"database"|"api"|"testing"|"devops"|"design",
    "priority": "critical"|"high"|"medium"|"low",
    "estimatedHours": number
  }]
}

Generate 5-12 tasks. Order them by dependency (things that need to happen first should come first). Be specific about implementation details.`
      },
      {
        role: "user",
        content: `Feature: ${proposal.title}\n\nProblem: ${proposal.problemStatement}\n\nSolution: ${proposal.proposedSolution}\n\nUI Changes: ${proposal.uiChanges}\n\nData Model Changes: ${proposal.dataModelChanges}\n\nWorkflow Changes: ${proposal.workflowChanges}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_breakdown",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string", enum: ["frontend", "backend", "database", "api", "testing", "devops", "design"] },
                  priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  estimatedHours: { type: "number" }
                },
                required: ["title", "description", "category", "priority", "estimatedHours"],
                additionalProperties: false
              }
            }
          },
          required: ["tasks"],
          additionalProperties: false
        }
      }
    }
  });

  const content = result.choices[0]?.message?.content;
  const parsed = typeof content === "string" ? JSON.parse(content) : null;
  return parsed?.tasks || [];
}

// ─── Company Research Pipeline ───
async function runCompanyResearch(researchId: number, projectId: number, companyUrl: string, projectName: string) {
  try {
    // Extract domain name for search queries
    let domain = companyUrl;
    try {
      const urlObj = new URL(companyUrl);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = companyUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
    const companyName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

    await db.updateCompanyResearch(researchId, { companyName, status: "searching" });

    // Step 1: Use LLM to search and gather information about the company
    const searchResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert market researcher and competitive analyst. Your task is to research the company at "${companyUrl}" (${companyName}) and find all publicly available feedback, reviews, discussions, and opinions about their products and services.

You must search your knowledge for:
1. Product reviews from sites like G2, Capterra, TrustRadius, Product Hunt, etc.
2. Forum discussions from Reddit, Hacker News, Stack Overflow, etc.
3. Social media sentiment from Twitter/X, LinkedIn, etc.
4. News articles and blog posts about the company
5. Customer support complaints or praise
6. General market perception

For each piece of feedback you find, provide:
- The source (where it came from, e.g., 'G2 Reviews', 'Reddit r/SaaS')
- The source URL (a real, specific URL where this feedback can be found or verified — e.g., 'https://www.g2.com/products/notion/reviews', 'https://www.reddit.com/r/Notion/', 'https://news.ycombinator.com/item?id=12345'). Use real URLs that actually exist for the platform.
- The type of source (review, forum, social_media, news, blog, support, other)
- A title summarizing the feedback
- The actual content/quote
- Whether the sentiment is positive, negative, or neutral
- A sentiment score from -100 (very negative) to +100 (very positive)
- A category (e.g., "pricing", "performance", "support", "features", "UX", "reliability", "security", "onboarding", "documentation", "integration")
- Relevant tags

Return a comprehensive JSON with 15-25 findings. Be thorough and realistic. Base this on what you actually know about this company and its products. If you don't have specific knowledge, generate realistic market research findings based on the company's domain and likely product category.

Return valid JSON matching this schema:
{
  "companyName": "string",
  "companyDescription": "string (1-2 sentences about what the company does)",
  "findings": [{
    "source": "string (e.g., 'G2 Reviews', 'Reddit r/SaaS', 'Hacker News')",
    "sourceUrl": "string (real URL where this feedback can be found, e.g., 'https://www.g2.com/products/notion/reviews')",
    "sourceType": "review"|"forum"|"social_media"|"news"|"blog"|"support"|"other",
    "title": "string",
    "content": "string (the actual feedback text, 2-4 sentences)",
    "sentiment": "positive"|"negative"|"neutral",
    "sentimentScore": number,
    "category": "string",
    "tags": ["string"]
  }]
}`
        },
        {
          role: "user",
          content: `Research the company at ${companyUrl} and find all public feedback about their products. Be thorough and cover multiple sources.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "company_research",
          strict: true,
          schema: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              companyDescription: { type: "string" },
              findings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string" },
                    sourceUrl: { type: "string" },
                    sourceType: { type: "string", enum: ["review", "forum", "social_media", "news", "blog", "support", "other"] },
                    title: { type: "string" },
                    content: { type: "string" },
                    sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
                    sentimentScore: { type: "number" },
                    category: { type: "string" },
                    tags: { type: "array", items: { type: "string" } }
                  },
                  required: ["source", "sourceUrl", "sourceType", "title", "content", "sentiment", "sentimentScore", "category", "tags"],
                  additionalProperties: false
                }
              }
            },
            required: ["companyName", "companyDescription", "findings"],
            additionalProperties: false
          }
        }
      }
    });

    const searchContent = searchResult.choices[0]?.message?.content;
    const searchParsed = typeof searchContent === "string" ? JSON.parse(searchContent) : null;
    if (!searchParsed) throw new Error("Failed to parse search results");

    await db.updateCompanyResearch(researchId, {
      companyName: searchParsed.companyName || companyName,
      status: "analyzing",
      rawSearchResults: searchParsed,
    });

    // Step 2: Save individual findings
    const findings = searchParsed.findings || [];
    if (findings.length > 0) {
      await db.createManyFindings(
        findings.map((f: any) => ({
          researchId,
          projectId,
          source: f.source,
          sourceUrl: f.sourceUrl || null,
          sourceType: f.sourceType as any,
          title: f.title,
          content: f.content,
          sentiment: f.sentiment as any,
          sentimentScore: f.sentimentScore,
          category: f.category,
          tags: f.tags,
        }))
      );
    }

    // Step 3: Analyze and summarize
    const positiveFindings = findings.filter((f: any) => f.sentiment === "positive");
    const negativeFindings = findings.filter((f: any) => f.sentiment === "negative");
    const neutralFindings = findings.filter((f: any) => f.sentiment === "neutral");

    const analysisResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert product analyst. Based on the following research findings about "${searchParsed.companyName}", provide a comprehensive summary analysis.

Return valid JSON matching this schema:
{
  "summary": "string (3-5 paragraph executive summary of the company's market perception)",
  "overallSentiment": "positive"|"negative"|"neutral"|"mixed",
  "keyStrengths": [{"title": "string", "description": "string", "evidenceCount": number}],
  "keyWeaknesses": [{"title": "string", "description": "string", "evidenceCount": number}],
  "recommendations": [{"title": "string", "description": "string", "priority": "high"|"medium"|"low", "category": "string"}]
}

Provide 3-6 items for strengths, weaknesses, and recommendations each. Base everything on the actual findings provided.`
        },
        {
          role: "user",
          content: `Here are the research findings:\n\n${JSON.stringify(findings, null, 2)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              overallSentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
              keyStrengths: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    evidenceCount: { type: "number" }
                  },
                  required: ["title", "description", "evidenceCount"],
                  additionalProperties: false
                }
              },
              keyWeaknesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    evidenceCount: { type: "number" }
                  },
                  required: ["title", "description", "evidenceCount"],
                  additionalProperties: false
                }
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" }
                  },
                  required: ["title", "description", "priority", "category"],
                  additionalProperties: false
                }
              }
            },
            required: ["summary", "overallSentiment", "keyStrengths", "keyWeaknesses", "recommendations"],
            additionalProperties: false
          }
        }
      }
    });

    const analysisContent = analysisResult.choices[0]?.message?.content;
    const analysisParsed = typeof analysisContent === "string" ? JSON.parse(analysisContent) : null;
    if (!analysisParsed) throw new Error("Failed to parse analysis");

    // Step 4: Update research with final results
    await db.updateCompanyResearch(researchId, {
      status: "completed",
      overallSentiment: analysisParsed.overallSentiment as any,
      positiveCount: positiveFindings.length,
      negativeCount: negativeFindings.length,
      neutralCount: neutralFindings.length,
      summary: analysisParsed.summary,
      keyStrengths: analysisParsed.keyStrengths,
      keyWeaknesses: analysisParsed.keyWeaknesses,
      recommendations: analysisParsed.recommendations,
      completedAt: new Date(),
    });

    notifyOwner({
      title: `Company Research Complete - ${searchParsed.companyName}`,
      content: `Research on "${searchParsed.companyName}" for project "${projectName}" is complete. Found ${findings.length} pieces of feedback: ${positiveFindings.length} positive, ${negativeFindings.length} negative, ${neutralFindings.length} neutral.`,
    }).catch(() => {});

  } catch (error: any) {
    console.error("[Research] Error:", error);
    await db.updateCompanyResearch(researchId, { status: "failed" });
    throw error;
  }
}
