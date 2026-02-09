import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ListChecks,
  Copy,
  Download,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORY_COLORS: Record<string, string> = {
  frontend: "bg-blue-50 text-blue-700 border-blue-200",
  backend: "bg-green-50 text-green-700 border-green-200",
  database: "bg-purple-50 text-purple-700 border-purple-200",
  api: "bg-orange-50 text-orange-700 border-orange-200",
  testing: "bg-yellow-50 text-yellow-700 border-yellow-200",
  devops: "bg-red-50 text-red-700 border-red-200",
  design: "bg-pink-50 text-pink-700 border-pink-200",
};

const STATUS_ICONS: Record<string, { icon: any; color: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground" },
  in_progress: { icon: Clock, color: "text-yellow-600" },
  done: { icon: CheckCircle2, color: "text-green-600" },
};

export default function TasksTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.task.listByProject.useQuery({ projectId });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusMutation = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.listByProject.invalidate({ projectId });
      toast.success("Task status updated");
    },
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.category)));
  }, [tasks]);

  const totalHours = useMemo(() => {
    return filteredTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  }, [filteredTasks]);

  const copyTasksToClipboard = () => {
    const text = filteredTasks
      .map(
        (t, i) =>
          `${i + 1}. [${t.category.toUpperCase()}] ${t.title}${
            t.description ? `\n   ${t.description}` : ""
          }${t.estimatedHours ? ` (~${t.estimatedHours}h)` : ""}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Tasks copied to clipboard!");
  };

  const exportAsMarkdown = () => {
    const grouped: Record<string, typeof filteredTasks> = {};
    filteredTasks.forEach((t) => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    let md = `# Development Tasks\n\n`;
    md += `Total: ${filteredTasks.length} tasks | Estimated: ${totalHours}h\n\n`;

    Object.entries(grouped).forEach(([cat, catTasks]) => {
      md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`;
      catTasks.forEach((t) => {
        const status = t.status === "done" ? "x" : " ";
        md += `- [${status}] **${t.title}**`;
        if (t.estimatedHours) md += ` (~${t.estimatedHours}h)`;
        md += `\n`;
        if (t.description) md += `  ${t.description}\n`;
        md += `\n`;
      });
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported as Markdown!");
  };

  const exportAsJSON = () => {
    const data = filteredTasks.map((t) => ({
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      estimatedHours: t.estimatedHours,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported as JSON!");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ListChecks className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No tasks yet</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Generate tasks from feature proposals to see development-ready task breakdowns here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progressPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">
            {tasks.length} Tasks &middot; {totalHours}h estimated &middot;{" "}
            {progressPercent}% complete
          </h3>
          <div className="w-48 h-1.5 bg-muted rounded-full mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={copyTasksToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={exportAsMarkdown}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as Markdown</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-9" onClick={exportAsJSON}>
                JSON
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as JSON</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task) => {
          const statusInfo = STATUS_ICONS[task.status] || STATUS_ICONS.todo;
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={task.id} className="group hover:shadow-sm transition-shadow">
              <CardContent className="flex items-start gap-3 p-4">
                <button
                  className={`mt-0.5 shrink-0 ${statusInfo.color}`}
                  onClick={() => {
                    const next =
                      task.status === "todo"
                        ? "in_progress"
                        : task.status === "in_progress"
                        ? "done"
                        : "todo";
                    statusMutation.mutate({ id: task.id, status: next });
                  }}
                >
                  <StatusIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`font-medium text-sm ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${CATEGORY_COLORS[task.category] || ""}`}
                    >
                      {task.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        task.priority === "critical"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : task.priority === "high"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : ""
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                {task.estimatedHours && (
                  <span className="text-xs text-muted-foreground shrink-0 mt-1">
                    ~{task.estimatedHours}h
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tasks match the current filters.
        </div>
      )}
    </div>
  );
}
