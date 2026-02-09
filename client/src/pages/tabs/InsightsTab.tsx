import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Loader2,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "oklch(0.65 0.15 160)",
  negative: "oklch(0.55 0.22 25)",
  neutral: "oklch(0.6 0.02 260)",
  mixed: "oklch(0.7 0.15 45)",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-blue-600 bg-blue-50 border-blue-200",
};

export default function InsightsTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: analyses, isLoading } = trpc.analysis.list.useQuery({ projectId });
  const { data: files } = trpc.dataFile.list.useQuery({ projectId });

  const runMutation = trpc.analysis.run.useMutation({
    onSuccess: () => {
      utils.analysis.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      toast.success("Analysis started! This may take a minute.");
    },
    onError: (err) => toast.error(err.message),
  });

  const latestAnalysis = analyses?.[0];
  const hasFiles = (files?.length ?? 0) > 0;
  const isProcessing = latestAnalysis?.status === "processing" || latestAnalysis?.status === "pending";

  // Auto-refresh while processing
  trpc.analysis.list.useQuery(
    { projectId },
    {
      refetchInterval: isProcessing ? 3000 : false,
    }
  );

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium">AI Feedback Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {!hasFiles
                ? "Upload data files first to run analysis"
                : isProcessing
                ? "Analysis is running... This typically takes 30-60 seconds."
                : latestAnalysis?.status === "completed"
                ? `Last analyzed ${new Date(latestAnalysis.completedAt!).toLocaleString()}`
                : "Run AI analysis on your uploaded customer data"}
            </p>
          </div>
          <Button
            onClick={() => runMutation.mutate({ projectId })}
            disabled={!hasFiles || runMutation.isPending || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : latestAnalysis?.status === "completed" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Re-analyze
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" /> Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div>
              <h3 className="font-medium">Processing your data...</h3>
              <p className="text-sm text-muted-foreground">
                The AI is analyzing themes, sentiment, pain points, and feature requests.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {latestAnalysis?.status === "failed" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">Analysis Failed</h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong. Please try running the analysis again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {latestAnalysis?.status === "completed" && (
        <AnalysisResults analysis={latestAnalysis} />
      )}

      {!latestAnalysis && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No analysis yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Upload customer data and run the AI analysis to discover insights about your product.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalysisResults({ analysis }: { analysis: any }) {
  const themes = (analysis.themes as any[]) || [];
  const painPoints = (analysis.painPoints as any[]) || [];
  const featureRequests = (analysis.featureRequests as any[]) || [];
  const sentiment = analysis.sentimentSummary as any;

  const sentimentData = sentiment
    ? [
        { name: "Positive", value: sentiment.positivePercent, color: SENTIMENT_COLORS.positive },
        { name: "Negative", value: sentiment.negativePercent, color: SENTIMENT_COLORS.negative },
        { name: "Neutral", value: sentiment.neutralPercent, color: SENTIMENT_COLORS.neutral },
      ]
    : [];

  const themeChartData = themes.map((t) => ({
    name: t.name.length > 20 ? t.name.slice(0, 20) + "..." : t.name,
    frequency: t.frequency,
    sentiment: t.sentiment,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Themes Found"
          value={themes.length}
          color="text-primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pain Points"
          value={painPoints.length}
          color="text-destructive"
        />
        <StatCard
          icon={TrendingUp}
          label="Feature Requests"
          value={featureRequests.length}
          color="text-chart-2"
        />
        <StatCard
          icon={
            sentiment?.overall === "positive"
              ? ThumbsUp
              : sentiment?.overall === "negative"
              ? ThumbsDown
              : Minus
          }
          label="Overall Sentiment"
          value={sentiment?.overall ? sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1) : "N/A"}
          color={
            sentiment?.overall === "positive"
              ? "text-chart-2"
              : sentiment?.overall === "negative"
              ? "text-destructive"
              : "text-muted-foreground"
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Pie Chart */}
        {sentiment && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
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
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-muted-foreground">
                      {s.name} ({s.value}%)
                    </span>
                  </div>
                ))}
              </div>
              {sentiment.highlights && sentiment.highlights.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {sentiment.highlights.slice(0, 3).map((h: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/30">
                      {h}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Theme Frequency Chart */}
        {themes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Theme Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themeChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 260)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid oklch(0.91 0.01 260)",
                        fontSize: "13px",
                      }}
                    />
                    <Bar
                      dataKey="frequency"
                      fill="oklch(0.55 0.18 265)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Themes Detail */}
      {themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurring Themes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {themes.map((theme, i) => (
              <ThemeRow key={i} theme={theme} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pain Points */}
      {painPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pain Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {painPoints.map((pp, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${SEVERITY_COLORS[pp.severity] || ""}`}
                  >
                    {pp.severity}
                  </Badge>
                  <span className="font-medium text-sm">{pp.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{pp.description}</p>
                <div className="mt-2">
                  <Progress value={pp.frequency} className="h-1.5" />
                  <span className="text-xs text-muted-foreground">
                    Frequency: {pp.frequency}/100
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Feature Requests */}
      {featureRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {featureRequests.map((fr, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${SEVERITY_COLORS[fr.priority] || ""}`}
                  >
                    {fr.priority}
                  </Badge>
                  <span className="font-medium text-sm">{fr.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {fr.requestCount} mentions
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{fr.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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

function ThemeRow({ theme }: { theme: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: SENTIMENT_COLORS[theme.sentiment] || SENTIMENT_COLORS.neutral }}
          />
          <span className="font-medium text-sm">{theme.name}</span>
          <Badge variant="secondary" className="text-xs">
            {theme.sentiment}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Freq: {theme.frequency}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {expanded && (
        <p className="text-sm text-muted-foreground mt-2 pl-6">
          {theme.description}
        </p>
      )}
    </div>
  );
}
