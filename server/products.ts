// ─── ProductFlow Pricing Plans ───
// Centralized plan definitions used by both backend and frontend
//
// Why the premium pricing?
// Each AI analysis runs multiple LLM calls against your data (~$0.50–2.00 per run).
// Each company research triggers live web crawling across 10–30 sources, search API
// calls, and multi-step LLM synthesis (~$1.00–3.00 per research). These are real
// infrastructure costs that scale with usage, not flat-rate commodity features.

export interface PlanLimits {
  maxProjects: number;       // -1 = unlimited
  maxAnalysesPerMonth: number; // -1 = unlimited
  maxResearchPerMonth: number; // -1 = unlimited
  maxFilesPerProject: number;  // -1 = unlimited
  priorityProcessing: boolean;
  exportToJira: boolean;
  teamCollaboration: boolean;
}

export interface PricingPlan {
  id: "free" | "pro" | "team";
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number;  // in cents (per month equivalent)
  stripePriceIdMonthly: string | null; // null for free tier
  stripePriceIdYearly: string | null;
  limits: PlanLimits;
  features: string[];
  highlighted: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    description: "Try the platform — no credit card required",
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      maxProjects: 2,
      maxAnalysesPerMonth: 3,
      maxResearchPerMonth: 1,
      maxFilesPerProject: 10,
      priorityProcessing: false,
      exportToJira: false,
      teamCollaboration: false,
    },
    features: [
      "2 projects",
      "3 AI analyses per month",
      "1 company research per month",
      "10 files per project",
      "Basic insights dashboard",
      "Feature proposals",
      "Task breakdowns",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Full-power discovery for PMs & founders",
    monthlyPrice: 4900, // $49
    yearlyPrice: 3900,  // $39/mo billed yearly
    stripePriceIdMonthly: "price_pro_monthly",
    stripePriceIdYearly: "price_pro_yearly",
    limits: {
      maxProjects: -1,
      maxAnalysesPerMonth: 50,
      maxResearchPerMonth: 20,
      maxFilesPerProject: -1,
      priorityProcessing: true,
      exportToJira: false,
      teamCollaboration: false,
    },
    features: [
      "Unlimited projects",
      "50 AI analyses per month",
      "20 live company researches per month",
      "Unlimited files per project",
      "Priority AI processing",
      "Advanced insights & charts",
      "Detailed feature proposals",
      "Export task breakdowns",
    ],
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    description: "Scale product discovery across your org",
    monthlyPrice: 12900, // $129
    yearlyPrice: 9900,   // $99/mo billed yearly
    stripePriceIdMonthly: "price_team_monthly",
    stripePriceIdYearly: "price_team_yearly",
    limits: {
      maxProjects: -1,
      maxAnalysesPerMonth: -1,
      maxResearchPerMonth: -1,
      maxFilesPerProject: -1,
      priorityProcessing: true,
      exportToJira: true,
      teamCollaboration: true,
    },
    features: [
      "Everything in Pro",
      "Unlimited AI analyses",
      "Unlimited live company research",
      "Team collaboration & sharing",
      "Export to Jira & Linear",
      "Priority support & onboarding",
      "Custom integrations",
      "API access",
    ],
    highlighted: false,
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getFreePlan(): PricingPlan {
  return PLANS[0];
}
