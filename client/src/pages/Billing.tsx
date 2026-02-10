import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CreditCard,
  ArrowRight,
  Loader2,
  Check,
  Zap,
  BarChart3,
  FolderKanban,
  Search,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Billing() {
  const [, setLocation] = useLocation();
  const { data: currentPlan, isLoading: planLoading } = trpc.billing.currentPlan.useQuery();
  const { data: plans } = trpc.billing.plans.useQuery();
  const { data: usage, isLoading: usageLoading } = trpc.billing.usage.useQuery();
  const checkoutMutation = trpc.billing.checkout.useMutation();
  const portalMutation = trpc.billing.portal.useMutation();

  const handleUpgrade = async (planId: "pro" | "team") => {
    try {
      const result = await checkoutMutation.mutateAsync({
        planId,
        interval: "monthly",
        origin: window.location.origin,
      });
      if (result.url) {
        toast.info("Redirecting to checkout...");
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create checkout session");
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await portalMutation.mutateAsync({
        origin: window.location.origin,
      });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    }
  };

  const currentPlanDef = useMemo(() => {
    if (!plans || !currentPlan) return null;
    return plans.find((p: any) => p.id === currentPlan.planId);
  }, [plans, currentPlan]);

  const isPaid = currentPlan?.planId !== "free";

  const usageItems = useMemo(() => {
    if (!usage || !currentPlanDef) return [];
    const items = [];

    // Projects
    const maxProjects = currentPlanDef.limits.maxProjects;
    items.push({
      label: "Projects",
      icon: FolderKanban,
      used: usage.projects,
      max: maxProjects,
      unlimited: maxProjects === -1,
    });

    // Analyses this month
    const maxAnalyses = currentPlanDef.limits.maxAnalysesPerMonth;
    items.push({
      label: "AI Analyses",
      icon: BarChart3,
      used: usage.analysesThisMonth,
      max: maxAnalyses,
      unlimited: maxAnalyses === -1,
    });

    // Research this month
    const maxResearch = currentPlanDef.limits.maxResearchPerMonth;
    items.push({
      label: "Company Research",
      icon: Search,
      used: usage.researchThisMonth,
      max: maxResearch,
      unlimited: maxResearch === -1,
    });

    return items;
  }, [usage, currentPlanDef]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing & Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and monitor usage. Each analysis and research uses live AI and web crawling infrastructure.
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Current Plan
                  {isPaid && <Crown className="h-4 w-4 text-amber-500" />}
                </CardTitle>
                <CardDescription>
                  {planLoading ? "Loading..." : `You're on the ${currentPlan?.planName || "Starter"} plan`}
                </CardDescription>
              </div>
              <Badge
                variant={isPaid ? "default" : "secondary"}
                className={`text-sm px-3 py-1 ${isPaid ? "bg-primary" : ""}`}
              >
                {currentPlan?.planName || "Starter"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {isPaid && currentPlan?.stripeCustomerId && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>
              )}
              {!isPaid && (
                <Button onClick={() => setLocation("/pricing")}>
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
              <Button variant="ghost" onClick={() => setLocation("/pricing")}>
                View All Plans
              </Button>
            </div>
            {isPaid && currentPlan?.planPeriodEnd && (
              <p className="text-xs text-muted-foreground mt-4">
                Current period ends: {new Date(currentPlan.planPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage This Month</CardTitle>
            <CardDescription>
              Track your resource consumption against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {usageItems.map((item) => {
                  const percent = item.unlimited
                    ? 0
                    : item.max > 0
                    ? Math.min((item.used / item.max) * 100, 100)
                    : 0;
                  const isNearLimit = !item.unlimited && percent >= 80;
                  const isAtLimit = !item.unlimited && percent >= 100;

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.used}
                          {item.unlimited ? (
                            <span className="ml-1 text-xs">/ unlimited</span>
                          ) : (
                            <span className="ml-1 text-xs">/ {item.max}</span>
                          )}
                        </span>
                      </div>
                      {!item.unlimited && (
                        <Progress
                          value={percent}
                          className={`h-2 ${
                            isAtLimit
                              ? "[&>div]:bg-destructive"
                              : isNearLimit
                              ? "[&>div]:bg-amber-500"
                              : ""
                          }`}
                        />
                      )}
                      {item.unlimited && (
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-r from-primary/20 to-primary/5 rounded-full" />
                        </div>
                      )}
                      {isAtLimit && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          Limit reached — upgrade to continue
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Upgrade Cards */}
        {!isPaid && plans && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Upgrade Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {plans
                .filter((p: any) => p.id !== "free")
                .map((plan: any) => (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.highlighted ? "border-primary shadow-md" : ""
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Recommended
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-2xl font-bold">
                          ${(plan.monthlyPrice / 100).toFixed(0)}
                        </span>
                        <span className="text-muted-foreground text-sm">/mo</span>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {plan.features.slice(0, 4).map((f: string) => (
                          <li key={f} className="flex items-center gap-2 text-xs">
                            <Check className="h-3 w-3 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                        disabled={checkoutMutation.isPending}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Upgrade to {plan.name}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
