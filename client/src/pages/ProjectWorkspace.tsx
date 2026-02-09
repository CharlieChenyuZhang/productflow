import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, BarChart3, Lightbulb, ListChecks } from "lucide-react";
import { useLocation, useParams } from "wouter";
import DataUploadTab from "./tabs/DataUploadTab";
import InsightsTab from "./tabs/InsightsTab";
import ProposalsTab from "./tabs/ProposalsTab";
import TasksTab from "./tabs/TasksTab";

export default function ProjectWorkspace() {
  return (
    <DashboardLayout>
      <WorkspaceContent />
    </DashboardLayout>
  );
}

function WorkspaceContent() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();

  const { data: project, isLoading } = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-5 bg-muted rounded w-96 mb-8" />
          <div className="h-10 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-4">This project may have been deleted.</p>
        <Button variant="outline" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setLocation("/projects")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
      </div>
      {project.description && (
        <p className="text-muted-foreground ml-11 mb-6 line-clamp-1">
          {project.description}
        </p>
      )}
      {!project.description && <div className="mb-6" />}

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 h-11">
          <TabsTrigger value="data" className="gap-2">
            <FileText className="h-3.5 w-3.5" /> Data
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Insights
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <Lightbulb className="h-3.5 w-3.5" /> Proposals
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListChecks className="h-3.5 w-3.5" /> Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6">
          <DataUploadTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          <InsightsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="proposals" className="mt-6">
          <ProposalsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <TasksTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
