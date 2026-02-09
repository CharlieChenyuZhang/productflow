import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  FileText,
  Table2,
  Trash2,
  FileUp,
  AlertCircle,
  Sparkles,
  Loader2,
  Download,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import FileViewerDialog from "@/components/FileViewerDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  EXAMPLE_TRANSCRIPTS,
  EXAMPLE_CSV_FILES,
  stringToBase64,
} from "@/lib/exampleData";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DataUploadTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.dataFile.list.useQuery({ projectId });
  const [loadingExample, setLoadingExample] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    id: number;
    fileName: string;
    fileType: "transcript" | "usage_data";
  } | null>(null);

  const uploadMutation = trpc.dataFile.upload.useMutation({
    onSuccess: () => {
      utils.dataFile.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      toast.success("File uploaded successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.dataFile.delete.useMutation({
    onSuccess: () => {
      utils.dataFile.list.invalidate({ projectId });
      utils.project.getStats.invalidate({ projectId });
      toast.success("File deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File, fileType: "transcript" | "usage_data") => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }
      if (fileType === "usage_data" && !file.name.endsWith(".csv")) {
        toast.error("Usage data must be a CSV file.");
        return;
      }
      if (
        fileType === "transcript" &&
        !file.name.endsWith(".txt") &&
        !file.name.endsWith(".md")
      ) {
        toast.error("Transcripts must be .txt or .md files.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          projectId,
          fileName: file.name,
          fileType,
          content: base64,
          mimeType: file.type || "text/plain",
        });
      };
      reader.readAsDataURL(file);
    },
    [projectId, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, fileType: "transcript" | "usage_data") => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file, fileType);
    },
    [handleFileUpload]
  );

  const loadAllTranscripts = useCallback(async () => {
    setLoadingExample("transcripts");
    try {
      for (const t of EXAMPLE_TRANSCRIPTS) {
        await uploadMutation.mutateAsync({
          projectId,
          fileName: t.name,
          fileType: "transcript",
          content: stringToBase64(t.content),
          mimeType: "text/plain",
        });
      }
      toast.success(`Loaded ${EXAMPLE_TRANSCRIPTS.length} example transcripts!`);
    } catch {
      // individual errors handled by mutation
    } finally {
      setLoadingExample(null);
    }
  }, [projectId, uploadMutation]);

  const loadAllCsvFiles = useCallback(async () => {
    setLoadingExample("csv");
    try {
      for (const c of EXAMPLE_CSV_FILES) {
        await uploadMutation.mutateAsync({
          projectId,
          fileName: c.name,
          fileType: "usage_data",
          content: stringToBase64(c.content),
          mimeType: "text/csv",
        });
      }
      toast.success(`Loaded ${EXAMPLE_CSV_FILES.length} example CSV files!`);
    } catch {
      // individual errors handled by mutation
    } finally {
      setLoadingExample(null);
    }
  }, [projectId, uploadMutation]);

  const loadAllExamples = useCallback(async () => {
    setLoadingExample("all");
    try {
      for (const t of EXAMPLE_TRANSCRIPTS) {
        await uploadMutation.mutateAsync({
          projectId,
          fileName: t.name,
          fileType: "transcript",
          content: stringToBase64(t.content),
          mimeType: "text/plain",
        });
      }
      for (const c of EXAMPLE_CSV_FILES) {
        await uploadMutation.mutateAsync({
          projectId,
          fileName: c.name,
          fileType: "usage_data",
          content: stringToBase64(c.content),
          mimeType: "text/csv",
        });
      }
      toast.success("All example files loaded!");
    } catch {
      // individual errors handled by mutation
    } finally {
      setLoadingExample(null);
    }
  }, [projectId, uploadMutation]);

  const transcripts = files?.filter((f) => f.fileType === "transcript") ?? [];
  const usageData = files?.filter((f) => f.fileType === "usage_data") ?? [];
  const hasAnyFiles = (files?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Quick Load All Examples Banner */}
      {!hasAnyFiles && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Try with example data</h3>
                <p className="text-xs text-muted-foreground">
                  Load {EXAMPLE_TRANSCRIPTS.length} sample interview transcripts and {EXAMPLE_CSV_FILES.length} CSV datasets to test the full analysis pipeline
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={loadAllExamples}
              disabled={loadingExample !== null}
            >
              {loadingExample === "all" ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Load All Examples
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Transcript Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Customer Interview Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver === "transcript"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver("transcript");
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, "transcript")}
            >
              <FileUp className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">
                Drop transcript files here
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Supports .txt and .md files up to 10MB
              </p>
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "transcript");
                  e.target.value = "";
                }}
              />
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => transcriptInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Browse Files
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAllTranscripts}
                  disabled={loadingExample !== null}
                  className="text-primary hover:text-primary"
                >
                  {loadingExample === "transcripts" ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Load {EXAMPLE_TRANSCRIPTS.length} Examples
                    </>
                  )}
                </Button>
              </div>
            </div>

            {transcripts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Uploaded Files ({transcripts.length})
                </p>
                {transcripts.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() =>
                      deleteMutation.mutate({ id: file.id, projectId })
                    }
                    onView={() =>
                      setViewingFile({
                        id: file.id,
                        fileName: file.fileName,
                        fileType: file.fileType as "transcript" | "usage_data",
                      })
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Data Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Table2 className="h-4 w-4 text-primary" />
              Product Usage Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver === "usage"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver("usage");
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, "usage_data")}
            >
              <FileUp className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Drop CSV files here</p>
              <p className="text-xs text-muted-foreground mb-3">
                Product analytics, usage metrics, survey results
              </p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "usage_data");
                  e.target.value = "";
                }}
              />
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Browse Files
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAllCsvFiles}
                  disabled={loadingExample !== null}
                  className="text-primary hover:text-primary"
                >
                  {loadingExample === "csv" ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Load {EXAMPLE_CSV_FILES.length} Examples
                    </>
                  )}
                </Button>
              </div>
            </div>

            {usageData.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Uploaded Files ({usageData.length})
                </p>
                {usageData.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() =>
                      deleteMutation.mutate({ id: file.id, projectId })
                    }
                    onView={() =>
                      setViewingFile({
                        id: file.id,
                        fileName: file.fileName,
                        fileType: file.fileType as "transcript" | "usage_data",
                      })
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {viewingFile && (
        <FileViewerDialog
          open={!!viewingFile}
          onOpenChange={(open) => !open && setViewingFile(null)}
          fileId={viewingFile.id}
          projectId={projectId}
          fileName={viewingFile.fileName}
          fileType={viewingFile.fileType}
        />
      )}

      {files && files.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Upload at least one file to begin analyzing customer feedback. The
              AI will process your transcripts and usage data to extract
              insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FileRow({ file, onDelete, onView }: { file: any; onDelete: () => void; onView: () => void }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 group cursor-pointer hover:bg-muted/60 transition-colors"
      onClick={onView}
    >
      <div className="flex items-center gap-3 min-w-0">
        {file.fileType === "transcript" ? (
          <FileText className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Table2 className="h-4 w-4 text-chart-2 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {formatSize(Number(file.fileSize))} &middot;{" "}
            {new Date(file.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {file.fileType === "transcript" ? "Transcript" : "Usage Data"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
