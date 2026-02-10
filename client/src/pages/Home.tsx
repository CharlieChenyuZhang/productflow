import { Button } from "@/components/ui/button";
import {
  Compass,
  ArrowRight,
  Upload,
  Brain,
  BarChart3,
  ListChecks,
  Sparkles,
  Zap,
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
          <Button onClick={() => setLocation("/projects")}>
            Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
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
          <p className="text-xs text-muted-foreground">
            AI-Native Product Discovery Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
