import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [yearly, setYearly] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { data: plans } = trpc.billing.plans.useQuery();
  const { data: currentPlan } = trpc.billing.currentPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const checkoutMutation = trpc.billing.checkout.useMutation();

  const handleUpgrade = async (planId: "pro" | "team") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    try {
      const result = await checkoutMutation.mutateAsync({
        planId,
        interval: yearly ? "yearly" : "monthly",
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

  const formatPrice = (cents: number) => {
    if (cents === 0) return "$0";
    return `$${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Compass className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ProductFlow</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Home
            </Button>
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/projects")}>
                Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Sign In <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Header */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Choose the plan that fits your team
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Start free, upgrade when you need more power. All plans include core product discovery features.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <Label
                htmlFor="billing-toggle"
                className={`text-sm ${!yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={yearly}
                onCheckedChange={setYearly}
              />
              <Label
                htmlFor="billing-toggle"
                className={`text-sm ${yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                Yearly
              </Label>
              {yearly && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Save 17%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(plans || []).map((plan) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isCurrentPlan = currentPlan?.planId === plan.id;
              const isHighlighted = plan.highlighted;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isHighlighted
                      ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                      : ""
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{formatPrice(price)}</span>
                      {price > 0 && (
                        <span className="text-muted-foreground text-sm ml-1">
                          /mo{yearly ? " (billed yearly)" : ""}
                        </span>
                      )}
                      {price === 0 && (
                        <span className="text-muted-foreground text-sm ml-1">forever</span>
                      )}
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature: string) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.id === "free" ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (isAuthenticated) {
                            setLocation("/projects");
                          } else {
                            window.location.href = getLoginUrl();
                          }
                        }}
                      >
                        {isCurrentPlan ? "Current Plan" : "Get Started Free"}
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${isHighlighted ? "" : ""}`}
                        variant={isHighlighted ? "default" : "outline"}
                        disabled={isCurrentPlan || checkoutMutation.isPending}
                        onClick={() => handleUpgrade(plan.id as "pro" | "team")}
                      >
                        {checkoutMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          <>
                            Upgrade to {plan.name}
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                q: "Can I try ProductFlow for free?",
                a: "Yes! The Free plan includes 2 projects, 3 AI analyses per month, and 1 company research. No credit card required.",
              },
              {
                q: "What happens when I hit my plan limits?",
                a: "You'll see a notification suggesting an upgrade. Your existing data and analyses remain accessible — you just can't create new ones until the next billing cycle or you upgrade.",
              },
              {
                q: "Can I cancel or downgrade anytime?",
                a: "Absolutely. You can manage your subscription from the billing portal. Downgrades take effect at the end of your current billing period.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards through Stripe. For Team plans, we can also arrange invoicing.",
              },
              {
                q: "Is my data secure?",
                a: "Yes. All data is encrypted in transit and at rest. Customer interview transcripts and analysis results are stored securely in S3 with access controls.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-card rounded-lg border p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">ProductFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-Native Product Discovery Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
