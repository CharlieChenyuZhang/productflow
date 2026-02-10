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
  Globe,
  Brain,
  Search,
  Server,
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
              Transparent Pricing
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Real AI research costs real infrastructure
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Every analysis and company research runs live AI models and web crawlers — not cached templates. Our pricing reflects the real cost of delivering genuine insights.
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
                  Save 20%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
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
                        className="w-full"
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

      {/* Why This Price — Cost Justification */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Why does ProductFlow cost more than a typical SaaS?
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Unlike tools that serve static dashboards, every action in ProductFlow triggers expensive, real-time AI and web infrastructure. Here's what happens behind the scenes when you click "Run Analysis" or "Research Company."
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">AI Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Each analysis runs multiple large language model calls against your uploaded data — extracting themes, sentiment, pain points, and feature requests. A single analysis can consume <strong className="text-foreground">$0.50–$2.00</strong> in LLM compute depending on data volume.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                <Server className="h-3.5 w-3.5 shrink-0" />
                Multi-pass LLM pipeline + structured output parsing
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Live Company Research</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Each research job crawls <strong className="text-foreground">10–30 live web sources</strong> — review sites, news articles, social media, and forums — then synthesizes findings with AI. This costs <strong className="text-foreground">$1.00–$3.00</strong> per research in search API fees and LLM processing.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0" />
                Live web search APIs + multi-source crawling + AI synthesis
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-8 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Traditional product tools charge $10–20/mo because they just display your data. ProductFlow actively <strong className="text-foreground">generates new intelligence</strong> from it — that's the difference. A single well-timed insight can save your team weeks of building the wrong feature.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Cost vs Value */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">The math makes sense</h2>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-card rounded-xl border p-5">
                <p className="text-3xl font-bold text-primary mb-1">$2K+</p>
                <p className="text-xs text-muted-foreground">Hiring a research consultant for one competitive analysis</p>
              </div>
              <div className="bg-card rounded-xl border p-5">
                <p className="text-3xl font-bold text-primary mb-1">40+ hrs</p>
                <p className="text-xs text-muted-foreground">Manual time to analyze 20 customer interviews</p>
              </div>
              <div className="bg-card rounded-xl border p-5 border-primary shadow-md">
                <p className="text-3xl font-bold text-primary mb-1">$49/mo</p>
                <p className="text-xs text-muted-foreground">ProductFlow Pro — 50 analyses + 20 researches, done in minutes</p>
              </div>
            </div>
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
                q: "Why is ProductFlow more expensive than other product tools?",
                a: "Most product tools are dashboards that display data you enter. ProductFlow runs live AI models and web crawlers on every action — each analysis costs us $0.50–2.00 in compute, and each company research costs $1–3 in search API and LLM fees. Our pricing covers these real infrastructure costs while still saving you thousands compared to manual research.",
              },
              {
                q: "Can I try ProductFlow for free?",
                a: "Yes! The Starter plan includes 2 projects, 3 AI analyses per month, and 1 company research — enough to see the full power of the platform. No credit card required.",
              },
              {
                q: "What happens when I hit my plan limits?",
                a: "You'll see a notification suggesting an upgrade. Your existing data and analyses remain fully accessible — you just can't create new ones until the next billing cycle or you upgrade your plan.",
              },
              {
                q: "How much would this cost to do manually?",
                a: "A single competitive research report from a consultant runs $2,000–5,000. Manually analyzing 20 customer interviews takes 40+ hours. ProductFlow delivers comparable insights in minutes for a fraction of the cost.",
              },
              {
                q: "Can I cancel or downgrade anytime?",
                a: "Absolutely. You can manage your subscription from the billing portal. Downgrades take effect at the end of your current billing period — no lock-in.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards through Stripe. For Team plans, we can also arrange invoicing for annual commitments.",
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
