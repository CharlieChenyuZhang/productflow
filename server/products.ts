// ─── ProductFlow Pricing Plans ───
// Centralized plan definitions used by both backend and frontend

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
    name: "Free",
    description: "Perfect for exploring product discovery",
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
    description: "For product managers and founders",
    monthlyPrice: 2900, // $29
    yearlyPrice: 2400,  // $24/mo billed yearly
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
      "20 company researches per month",
      "Unlimited files per project",
      "Priority processing",
      "Advanced insights & charts",
      "Feature proposals with detail",
      "Export task breakdowns",
    ],
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    description: "For product teams shipping fast",
    monthlyPrice: 7900, // $79
    yearlyPrice: 6600,  // $66/mo billed yearly
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
      "Unlimited analyses",
      "Unlimited company research",
      "Team collaboration",
      "Export to Jira & Linear",
      "Priority support",
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
