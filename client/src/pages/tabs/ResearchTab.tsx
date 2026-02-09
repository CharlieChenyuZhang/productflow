import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Globe,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Streamdown } from "streamdown";

const SENTIMENT_COLORS = {
  positive: "oklch(0.65 0.15 160)",
  negative: "oklch(0.55 0.22 25)",
  neutral: "oklch(0.6 0.02 260)",
  mixed: "oklch(0.7 0.15 45)",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  review: "Review",
  forum: "Forum",
  social_media: "Social Media",
  news: "News",
  blog: "Blog",
  support: "Support",
  other: "Other",
};

const SENTIMENT_BADGE_STYLES: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  negative: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function ResearchTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const [companyUrl, setCompanyUrl] = useState("");
  const { data: researchList, isLoading } = trpc.research.list.useQuery({ projectId });
  const [selectedResearchId, setSelectedResearchId] = useState<number | null>(null);

  const startMutation = trpc.research.start.useMutation({
    onSuccess: (data) => {
      utils.research.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      setSelectedResearchId(data.id);
      setCompanyUrl("");
      toast.success("Research started! This may take 1-2 minutes.");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.research.delete.useMutation({
    onSuccess: () => {
      utils.research.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      if (selectedResearchId) setSelectedResearchId(null);
      toast.success("Research deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const latestResearch = researchList?.[0];
  const isProcessing = latestResearch?.status === "searching" || latestResearch?.status === "analyzing" || latestResearch?.status === "pending";

  // Auto-refresh while processing
  trpc.research.list.useQuery(
    { projectId },
    { refetchInterval: isProcessing ? 3000 : false }
  );

  const activeResearch = selectedResearchId
    ? researchList?.find((r) => r.id === selectedResearchId)
    : latestResearch;

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Company Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Enter a company website URL to automatically research public feedback, reviews, and discussions about their products. The AI will analyze sentiment and categorize findings.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="e.g., stripe.com, notion.so, figma.com"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && companyUrl.trim()) {
                  startMutation.mutate({ projectId, companyUrl: companyUrl.trim() });
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => startMutation.mutate({ projectId, companyUrl: companyUrl.trim() })}
              disabled={!companyUrl.trim() || startMutation.isPending || isProcessing}
            >
              {startMutation.isPending || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {isProcessing && activeResearch && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin shrink-0" />
            <div>
              <h3 className="font-medium">
                {activeResearch.status === "searching"
                  ? "Searching for public feedback..."
                  : activeResearch.status === "analyzing"
                  ? "Analyzing sentiment and categorizing..."
                  : "Starting research..."}
              </h3>
              <p className="text-sm text-muted-foreground">
                Researching {activeResearch.companyUrl}. This typically takes 1-2 minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research History */}
      {researchList && researchList.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Research History
          </p>
          <div className="flex flex-wrap gap-2">
            {researchList.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedResearchId(r.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  activeResearch?.id === r.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="font-medium">{r.companyName || r.companyUrl}</span>
                {r.status === "completed" && r.overallSentiment && (
                  <SentimentDot sentiment={r.overallSentiment} />
                )}
                {(r.status === "searching" || r.status === "analyzing" || r.status === "pending") && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                )}
                {r.status === "failed" && (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate({ id: r.id, projectId });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Research Results */}
      {activeResearch?.status === "completed" && (
        <ResearchResults research={activeResearch} />
      )}

      {activeResearch?.status === "failed" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">Research Failed</h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong while researching this company. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!researchList?.length && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No research yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Enter a company website above to research public feedback and sentiment about their products.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  return (
    <div
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.neutral }}
    />
  );
}

function ResearchResults({ research }: { research: any }) {
  const { data: findings } = trpc.research.getFindings.useQuery(
    { researchId: research.id },
    { enabled: !!research.id }
  );

  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

  const strengths = (research.keyStrengths as any[]) || [];
  const weaknesses = (research.keyWeaknesses as any[]) || [];
  const recommendations = (research.recommendations as any[]) || [];

  const filteredFindings = useMemo(() => {
    if (!findings) return [];
    if (sentimentFilter === "all") return findings;
    return findings.filter((f) => f.sentiment === sentimentFilter);
  }, [findings, sentimentFilter]);

  // Category distribution data
  const categoryData = useMemo(() => {
    if (!findings) return [];
    const counts: Record<string, { positive: number; negative: number; neutral: number }> = {};
    findings.forEach((f) => {
      const cat = f.category || "Other";
      if (!counts[cat]) counts[cat] = { positive: 0, negative: 0, neutral: 0 };
      counts[cat][f.sentiment as "positive" | "negative" | "neutral"]++;
    });
    return Object.entries(counts)
      .map(([name, vals]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "..." : name,
        positive: vals.positive,
        negative: vals.negative,
        neutral: vals.neutral,
      }))
      .sort((a, b) => (b.positive + b.negative + b.neutral) - (a.positive + a.negative + a.neutral))
      .slice(0, 8);
  }, [findings]);

  // Source type distribution
  const sourceData = useMemo(() => {
    if (!findings) return [];
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      const src = SOURCE_TYPE_LABELS[f.sourceType] || f.sourceType;
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [findings]);

  const sentimentPieData = [
    { name: "Positive", value: research.positiveCount || 0, color: SENTIMENT_COLORS.positive },
    { name: "Negative", value: research.negativeCount || 0, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", value: research.neutralCount || 0, color: SENTIMENT_COLORS.neutral },
  ];

  const totalFindings = (research.positiveCount || 0) + (research.negativeCount || 0) + (research.neutralCount || 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total Findings"
          value={totalFindings}
          color="text-primary"
        />
        <StatCard
          icon={ThumbsUp}
          label="Positive"
          value={research.positiveCount || 0}
          color="text-emerald-600"
        />
        <StatCard
          icon={ThumbsDown}
          label="Negative"
          value={research.negativeCount || 0}
          color="text-red-600"
        />
        <StatCard
          icon={
            research.overallSentiment === "positive" ? TrendingUp
              : research.overallSentiment === "negative" ? TrendingDown
              : Minus
          }
          label="Overall Sentiment"
          value={research.overallSentiment ? research.overallSentiment.charAt(0).toUpperCase() + research.overallSentiment.slice(1) : "N/A"}
          color={
            research.overallSentiment === "positive" ? "text-emerald-600"
              : research.overallSentiment === "negative" ? "text-red-600"
              : "text-muted-foreground"
          }
        />
      </div>

      {/* Executive Summary */}
      {research.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <Streamdown>{research.summary}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value} findings`}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid oklch(0.91 0.01 260)",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {sentimentPieData.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feedback by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 260)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid oklch(0.91 0.01 260)",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} radius={[0, 0, 0, 0]} name="Positive" />
                    <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} radius={[0, 0, 0, 0]} name="Negative" />
                    <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} radius={[0, 4, 4, 0]} name="Neutral" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {strengths.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengths.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{s.title}</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                      {s.evidenceCount} mentions
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {weaknesses.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Key Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weaknesses.map((w: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{w.title}</span>
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                      {w.evidenceCount} mentions
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{w.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((r: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      r.priority === "high"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : r.priority === "medium"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {r.priority}
                  </Badge>
                  <span className="font-medium text-sm">{r.title}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {r.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Individual Findings */}
      {findings && findings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Findings ({findings.length})</CardTitle>
              <div className="flex gap-1.5">
                {["all", "positive", "negative", "neutral"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSentimentFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sentimentFilter === filter
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== "all" && findings && (
                      <span className="ml-1">
                        ({findings.filter((f) => f.sentiment === filter).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredFindings.map((finding, i) => (
              <FindingRow
                key={finding.id || i}
                finding={finding}
                expanded={expandedFinding === (finding.id || i)}
                onToggle={() =>
                  setExpandedFinding(
                    expandedFinding === (finding.id || i) ? null : (finding.id || i)
                  )
                }
              />
            ))}
            {filteredFindings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No findings match this filter.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  expanded,
  onToggle,
}: {
  finding: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sentimentIcon =
    finding.sentiment === "positive" ? ThumbsUp
      : finding.sentiment === "negative" ? ThumbsDown
      : Minus;
  const SentimentIcon = sentimentIcon;
  const tags = (finding.tags as string[]) || [];

  return (
    <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            finding.sentiment === "positive"
              ? "bg-emerald-100 text-emerald-700"
              : finding.sentiment === "negative"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <SentimentIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{finding.title}</span>
            <Badge
              variant="outline"
              className={`text-xs ${SENTIMENT_BADGE_STYLES[finding.sentiment] || ""}`}
            >
              {finding.sentiment}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{finding.source}</span>
            <span className="text-xs text-muted-foreground">&middot;</span>
            <Badge variant="secondary" className="text-xs h-5">
              {finding.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {finding.sentimentScore !== null && (
            <span
              className={`text-xs font-mono font-medium ${
                finding.sentimentScore > 0
                  ? "text-emerald-600"
                  : finding.sentimentScore < 0
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {finding.sentimentScore > 0 ? "+" : ""}
              {finding.sentimentScore}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pl-11 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {finding.content}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
