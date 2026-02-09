import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Lightbulb,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Monitor,
  Database,
  Workflow,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Streamdown } from "streamdown";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const EFFORT_LABELS: Record<string, string> = {
  small: "S (1-2 days)",
  medium: "M (3-5 days)",
  large: "L (1-2 weeks)",
  xlarge: "XL (2+ weeks)",
};

const STATUS_ICONS: Record<string, any> = {
  draft: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  in_progress: ArrowRight,
  completed: CheckCircle2,
};

export default function ProposalsTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: proposals, isLoading } = trpc.proposal.list.useQuery({ projectId });
  const { data: analyses } = trpc.analysis.list.useQuery({ projectId });

  const latestCompletedAnalysis = analyses?.find((a) => a.status === "completed");

  const generateMutation = trpc.proposal.generate.useMutation({
    onSuccess: (data) => {
      utils.proposal.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      toast.success(`Generated ${data.count} feature proposals!`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Generate Controls */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium">AI Feature Proposals</h3>
            <p className="text-sm text-muted-foreground">
              {!latestCompletedAnalysis
                ? "Complete an analysis first to generate feature proposals"
                : "Generate detailed feature proposals based on your analysis insights"}
            </p>
          </div>
          <Button
            onClick={() =>
              generateMutation.mutate({
                projectId,
                analysisId: latestCompletedAnalysis!.id,
              })
            }
            disabled={!latestCompletedAnalysis || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Proposals
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Proposals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-2/3 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !proposals?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No proposals yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Run an analysis and then generate feature proposals to see AI-driven recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, projectId }: { proposal: any; projectId: number }) {
  const [expanded, setExpanded] = useState(false);
  const utils = trpc.useUtils();

  const statusMutation = trpc.proposal.updateStatus.useMutation({
    onSuccess: () => {
      utils.proposal.list.invalidate({ projectId });
      toast.success("Status updated");
    },
  });

  const taskGenMutation = trpc.task.generate.useMutation({
    onSuccess: (data) => {
      utils.task.listByProposal.invalidate({ featureProposalId: proposal.id });
      utils.task.listByProject.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      toast.success(`Generated ${data.count} development tasks!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const StatusIcon = STATUS_ICONS[proposal.status] || Clock;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${PRIORITY_STYLES[proposal.priority]}`}>
                  {proposal.priority}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {EFFORT_LABELS[proposal.effort] || proposal.effort}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {proposal.status.replace("_", " ")}
                </Badge>
              </div>
              <h3 className="font-semibold text-base">{proposal.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {proposal.problemStatement}
              </p>
            </div>
            <div className="shrink-0">
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t px-5 pb-5 pt-4 space-y-5">
            {/* Status & Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={proposal.status}
                onValueChange={(val) =>
                  statusMutation.mutate({ id: proposal.id, status: val as any })
                }
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  taskGenMutation.mutate({
                    featureProposalId: proposal.id,
                    projectId,
                  })
                }
                disabled={taskGenMutation.isPending}
              >
                {taskGenMutation.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                )}
                Generate Tasks
              </Button>
            </div>

            {/* Problem Statement */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                Problem Statement
              </h4>
              <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4 prose prose-sm max-w-none">
                <Streamdown>{proposal.problemStatement}</Streamdown>
              </div>
            </div>

            {/* Proposed Solution */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Proposed Solution</h4>
              <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4 prose prose-sm max-w-none">
                <Streamdown>{proposal.proposedSolution}</Streamdown>
              </div>
            </div>

            {/* Changes Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {proposal.uiChanges && (
                <div className="rounded-lg border p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" /> UI Changes
                  </h5>
                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                    <Streamdown>{proposal.uiChanges}</Streamdown>
                  </div>
                </div>
              )}
              {proposal.dataModelChanges && (
                <div className="rounded-lg border p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Data Model
                  </h5>
                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                    <Streamdown>{proposal.dataModelChanges}</Streamdown>
                  </div>
                </div>
              )}
              {proposal.workflowChanges && (
                <div className="rounded-lg border p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Workflow className="h-3.5 w-3.5" /> Workflow
                  </h5>
                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                    <Streamdown>{proposal.workflowChanges}</Streamdown>
                  </div>
                </div>
              )}
            </div>

            {/* Tasks Preview */}
            <ProposalTasks featureProposalId={proposal.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalTasks({ featureProposalId }: { featureProposalId: number }) {
  const { data: tasks } = trpc.task.listByProposal.useQuery({ featureProposalId });

  if (!tasks?.length) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">
        Development Tasks ({tasks.length})
      </h4>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 text-sm"
          >
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {task.category}
            </Badge>
            <span className="flex-1 truncate">{task.title}</span>
            {task.estimatedHours && (
              <span className="text-xs text-muted-foreground shrink-0">
                ~{task.estimatedHours}h
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
