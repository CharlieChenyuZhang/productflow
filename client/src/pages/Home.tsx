import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  ArrowRight,
  Upload,
  Brain,
  BarChart3,
  ListChecks,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Compass className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ProductFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/pricing")}>
              Pricing
            </Button>
            <Button onClick={() => setLocation("/projects")}>
              Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Native Product Discovery
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Figure out <span className="text-primary">what to build</span>,
              <br />not just how to build it
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload customer interviews and product data, get AI-powered insights, and generate feature proposals with development-ready task breakdowns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
                onClick={() => setLocation("/projects")}
              >
                Start Discovering <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
                onClick={() => setLocation("/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              From feedback to features in minutes
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete workflow that turns raw customer data into actionable development tasks.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Upload,
                title: "Upload Data",
                desc: "Import customer interview transcripts and product usage data in text or CSV format.",
                step: "01",
              },
              {
                icon: Brain,
                title: "AI Analysis",
                desc: "Our AI extracts themes, pain points, sentiment, and feature requests from your data.",
                step: "02",
              },
              {
                icon: BarChart3,
                title: "View Insights",
                desc: "Explore interactive dashboards showing prioritized findings with visual charts.",
                step: "03",
              },
              {
                icon: ListChecks,
                title: "Get Tasks",
                desc: "Generate feature proposals and dev-ready task breakdowns for your coding agents.",
                step: "04",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-card rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-xs font-bold text-primary/40 mb-4">STEP {item.step}</div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "10x Faster Discovery",
                desc: "What used to take weeks of manual analysis now happens in minutes with AI-powered processing.",
              },
              {
                icon: Brain,
                title: "Data-Driven Decisions",
                desc: "Every feature proposal is grounded in actual customer feedback, not gut feelings.",
              },
              {
                icon: ListChecks,
                title: "Agent-Ready Output",
                desc: "Task breakdowns are structured for AI coding agents like Cursor and Claude Code.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Real AI research, honestly priced
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Every analysis runs live AI models. Every research crawls real websites. Our pricing reflects the genuine cost of delivering insights — not serving static dashboards.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "forever",
                desc: "Try the full platform",
                features: ["2 projects", "3 AI analyses/mo", "1 live research/mo"],
                highlighted: false,
                cta: "Get Started Free",
              },
              {
                name: "Pro",
                price: "$49",
                period: "/mo",
                desc: "Full-power discovery",
                features: ["Unlimited projects", "50 AI analyses/mo", "20 live researches/mo", "Priority AI processing"],
                highlighted: true,
                cta: "Upgrade to Pro",
              },
              {
                name: "Team",
                price: "$129",
                period: "/mo",
                desc: "Scale across your org",
                features: ["Everything in Pro", "Unlimited analyses & research", "Team collaboration", "Export to Jira & Linear"],
                highlighted: false,
                cta: "Upgrade to Team",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-card rounded-xl border p-6 flex flex-col ${
                  plan.highlighted ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setLocation("/pricing")}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to discover what to build next?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Start analyzing your customer feedback today and let AI help you make better product decisions.
          </p>
          <Button
            size="lg"
            className="h-12 px-8 text-base shadow-lg"
            onClick={() => setLocation("/projects")}
          >
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/pricing")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <p className="text-xs text-muted-foreground">
              AI-Native Product Discovery Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
