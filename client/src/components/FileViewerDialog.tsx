import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Table2,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  Hash,
  Type,
  Download,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "oklch(0.65 0.2 250)",
  "oklch(0.65 0.2 150)",
  "oklch(0.65 0.2 30)",
  "oklch(0.65 0.2 330)",
  "oklch(0.65 0.2 200)",
  "oklch(0.65 0.2 80)",
  "oklch(0.65 0.2 290)",
  "oklch(0.65 0.2 110)",
];

interface FileViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: number;
  projectId: number;
  fileName: string;
  fileType: "transcript" | "usage_data";
}

export default function FileViewerDialog({
  open,
  onOpenChange,
  fileId,
  projectId,
  fileName,
  fileType,
}: FileViewerDialogProps) {
  const { data, isLoading, error } = trpc.dataFile.getContent.useQuery(
    { id: fileId, projectId },
    { enabled: open }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            {fileType === "transcript" ? (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4.5 w-4.5 text-primary" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Table2 className="h-4.5 w-4.5 text-chart-2" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base">{fileName}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fileType === "transcript" ? "Customer Interview Transcript" : "Product Usage Data"}
                {data && ` · ${formatSize(data.fileSize)}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading file content...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-64 text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Failed to load file content</span>
            </div>
          )}
          {data && fileType === "transcript" && (
            <TranscriptViewer content={data.content} fileName={data.fileName} />
          )}
          {data && fileType === "usage_data" && (
            <CsvViewer content={data.content} fileName={data.fileName} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transcript Viewer ───

function TranscriptViewer({ content, fileName }: { content: string; fileName: string }) {
  const parsed = useMemo(() => parseTranscript(content), [content]);

  return (
    <ScrollArea className="h-[calc(85vh-120px)]">
      <div className="px-6 py-4 space-y-4">
        {/* Metadata header */}
        {parsed.metadata.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {parsed.metadata.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-muted-foreground">{m.label}: </span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation */}
        {parsed.segments.length > 0 ? (
          <div className="space-y-3">
            {parsed.segments.map((seg, i) => (
              <div key={i} className={`flex gap-3 ${seg.type === "question" ? "" : ""}`}>
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                    seg.type === "question"
                      ? "bg-primary/10 text-primary"
                      : "bg-chart-2/10 text-chart-2"
                  }`}
                >
                  {seg.speaker}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      seg.type === "question" ? "font-medium text-foreground" : "text-foreground/90"
                    }`}
                  >
                    {seg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback: raw text with line highlighting */
          <div className="space-y-1">
            {content.split("\n").map((line, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed ${
                  line.trim() === "" ? "h-3" : isHeaderLine(line) ? "font-semibold text-foreground" : "text-foreground/85"
                }`}
              >
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        )}

        {/* Quick stats */}
        {parsed.segments.length > 0 && (
          <Card className="bg-muted/30 mt-4">
            <CardContent className="py-3 px-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Questions: </span>
                  <span className="font-medium">{parsed.segments.filter((s) => s.type === "question").length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Responses: </span>
                  <span className="font-medium">{parsed.segments.filter((s) => s.type === "answer").length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Word count: </span>
                  <span className="font-medium">
                    {content.split(/\s+/).filter(Boolean).length.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── CSV Viewer ───

type SortConfig = { column: string; direction: "asc" | "desc" } | null;

function CsvViewer({ content, fileName }: { content: string; fileName: string }) {
  const { headers, rows, numericColumns, stats } = useMemo(() => parseCsv(content), [content]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [chartColumn, setChartColumn] = useState<string | null>(null);
  const [labelColumn, setLabelColumn] = useState<string>(headers[0] || "");

  // Sorted rows
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;
    const { column, direction } = sortConfig;
    const colIdx = headers.indexOf(column);
    if (colIdx === -1) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[colIdx];
      const bVal = b[colIdx];
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [rows, sortConfig, headers]);

  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev?.column === column) {
        return prev.direction === "asc" ? { column, direction: "desc" } : null;
      }
      return { column, direction: "asc" };
    });
  };

  // Auto-select first numeric column for chart
  const activeChartCol = chartColumn || numericColumns[0] || null;
  const labelColIdx = headers.indexOf(labelColumn);
  const chartColIdx = activeChartCol ? headers.indexOf(activeChartCol) : -1;

  const chartData = useMemo(() => {
    if (chartColIdx === -1 || labelColIdx === -1) return [];
    return rows
      .map((row) => ({
        name: row[labelColIdx]?.length > 20 ? row[labelColIdx].slice(0, 18) + "…" : row[labelColIdx],
        value: parseFloat(row[chartColIdx]) || 0,
      }))
      .slice(0, 20); // limit to 20 items for readability
  }, [rows, chartColIdx, labelColIdx]);

  // Distribution chart for string columns
  const stringColumns = headers.filter((h) => !numericColumns.includes(h));

  return (
    <ScrollArea className="h-[calc(85vh-120px)]">
      <div className="px-6 py-4 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Hash className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-semibold">{rows.length}</p>
                <p className="text-xs text-muted-foreground">Rows</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Table2 className="h-4 w-4 text-chart-2" />
              <div>
                <p className="text-lg font-semibold">{headers.length}</p>
                <p className="text-xs text-muted-foreground">Columns</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-chart-3" />
              <div>
                <p className="text-lg font-semibold">{numericColumns.length}</p>
                <p className="text-xs text-muted-foreground">Numeric</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Type className="h-4 w-4 text-chart-4" />
              <div>
                <p className="text-lg font-semibold">{stringColumns.length}</p>
                <p className="text-xs text-muted-foreground">Categorical</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Numeric column stats */}
        {Object.keys(stats).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Column Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Column</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Min</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Max</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Mean</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats).map(([col, s]) => (
                      <tr key={col} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{col}</td>
                        <td className="text-right py-2 px-3 text-muted-foreground">{s.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-right py-2 px-3 text-muted-foreground">{s.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-right py-2 px-3 text-muted-foreground">{s.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-right py-2 px-3 text-muted-foreground">{s.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bar chart visualization */}
        {activeChartCol && chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Data Visualization
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background"
                    value={labelColumn}
                    onChange={(e) => setLabelColumn(e.target.value)}
                  >
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        Label: {h}
                      </option>
                    ))}
                  </select>
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background"
                    value={activeChartCol}
                    onChange={(e) => setChartColumn(e.target.value)}
                  >
                    {numericColumns.map((h) => (
                      <option key={h} value={h}>
                        Value: {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    className="fill-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" fill="oklch(0.55 0.2 250)" radius={[4, 4, 0, 0]} name={activeChartCol} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribution pie chart for categorical columns */}
        {stringColumns.length > 0 && rows.length > 0 && (
          <CategoricalDistribution headers={headers} rows={rows} stringColumns={stringColumns} />
        )}

        {/* Data table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                Raw Data
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {rows.length} rows × {headers.length} cols
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground border-b w-10">#</th>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 font-medium text-muted-foreground border-b cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                        onClick={() => handleSort(h)}
                      >
                        <span className="flex items-center gap-1">
                          {h}
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                          {sortConfig?.column === h && (
                            <span className="text-primary text-[10px]">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`py-1.5 px-3 whitespace-nowrap ${
                            numericColumns.includes(headers[j])
                              ? "text-right font-mono"
                              : ""
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ─── Categorical Distribution Sub-component ───

function CategoricalDistribution({
  headers,
  rows,
  stringColumns,
}: {
  headers: string[];
  rows: string[][];
  stringColumns: string[];
}) {
  const [selectedCat, setSelectedCat] = useState(stringColumns[0]);
  const catIdx = headers.indexOf(selectedCat);

  const distData = useMemo(() => {
    if (catIdx === -1) return [];
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      const val = row[catIdx] || "(empty)";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [rows, catIdx]);

  if (distData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Category Distribution
          </CardTitle>
          <select
            className="text-xs border rounded px-2 py-1 bg-background"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            {stringColumns.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={distData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={true}
              fontSize={10}
            >
              {distData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend fontSize={10} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Parsing Helpers ───

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isHeaderLine(line: string): boolean {
  return (
    line.startsWith("Customer Interview") ||
    line.startsWith("Date:") ||
    line.startsWith("Interviewer:") ||
    /^[A-Z][a-z]+ Interview/.test(line)
  );
}

interface TranscriptSegment {
  type: "question" | "answer";
  speaker: string;
  text: string;
}

interface ParsedTranscript {
  metadata: { label: string; value: string }[];
  segments: TranscriptSegment[];
}

function parseTranscript(content: string): ParsedTranscript {
  const lines = content.split("\n");
  const metadata: { label: string; value: string }[] = [];
  const segments: TranscriptSegment[] = [];

  let inBody = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse metadata lines (first few lines before Q&A)
    if (!inBody) {
      if (trimmed.startsWith("Q:") || trimmed.startsWith("Q :")) {
        inBody = true;
      } else {
        // Try to extract key-value metadata
        const titleMatch = trimmed.match(/^Customer Interview\s*[-–—]\s*(.+)/);
        if (titleMatch) {
          metadata.push({ label: "Interviewee", value: titleMatch[1].trim() });
          continue;
        }
        const kvMatch = trimmed.match(/^(Date|Interviewer|Role|Company|Duration)\s*:\s*(.+)/i);
        if (kvMatch) {
          metadata.push({ label: kvMatch[1], value: kvMatch[2].trim() });
          continue;
        }
        // Check for pipe-separated metadata
        if (trimmed.includes("|")) {
          const parts = trimmed.split("|").map((p) => p.trim());
          for (const part of parts) {
            const kv = part.match(/^(\w[\w\s]*?)\s*:\s*(.+)/);
            if (kv) {
              metadata.push({ label: kv[1].trim(), value: kv[2].trim() });
            }
          }
          continue;
        }
      }
    }

    if (inBody) {
      if (trimmed.startsWith("Q:") || trimmed.startsWith("Q :")) {
        segments.push({
          type: "question",
          speaker: "Q",
          text: trimmed.replace(/^Q\s*:\s*/, ""),
        });
      } else if (trimmed.startsWith("A:") || trimmed.startsWith("A :")) {
        segments.push({
          type: "answer",
          speaker: "A",
          text: trimmed.replace(/^A\s*:\s*/, ""),
        });
      } else if (segments.length > 0) {
        // Continuation of previous segment
        segments[segments.length - 1].text += " " + trimmed;
      }
    }
  }

  return { metadata, segments };
}

interface CsvStats {
  min: number;
  max: number;
  mean: number;
  sum: number;
}

function parseCsv(content: string): {
  headers: string[];
  rows: string[][];
  numericColumns: string[];
  stats: Record<string, CsvStats>;
} {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [], numericColumns: [], stats: {} };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    // Simple CSV parsing (handles basic cases)
    return line.split(",").map((cell) => cell.trim());
  });

  // Detect numeric columns
  const numericColumns: string[] = [];
  const stats: Record<string, CsvStats> = {};

  headers.forEach((header, colIdx) => {
    const values = rows.map((row) => parseFloat(row[colIdx])).filter((v) => !isNaN(v));
    if (values.length > rows.length * 0.5) {
      // More than 50% numeric = numeric column
      numericColumns.push(header);
      const sum = values.reduce((a, b) => a + b, 0);
      stats[header] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: sum / values.length,
        sum,
      };
    }
  });

  return { headers, rows, numericColumns, stats };
}
