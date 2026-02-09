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
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/csv",
];

export default function DataUploadTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.dataFile.list.useQuery({ projectId });

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

  const transcripts = files?.filter((f) => f.fileType === "transcript") ?? [];
  const usageData = files?.filter((f) => f.fileType === "usage_data") ?? [];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Transcript Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Customer Interview Transcripts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
              <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => transcriptInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {uploadMutation.isPending ? "Uploading..." : "Browse Files"}
              </Button>
            </div>

            {transcripts.length > 0 && (
              <div className="mt-4 space-y-2">
                {transcripts.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() =>
                      deleteMutation.mutate({ id: file.id, projectId })
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
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
              <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">
                Drop CSV files here
              </p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {uploadMutation.isPending ? "Uploading..." : "Browse Files"}
              </Button>
            </div>

            {usageData.length > 0 && (
              <div className="mt-4 space-y-2">
                {usageData.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={() =>
                      deleteMutation.mutate({ id: file.id, projectId })
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {files && files.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Upload at least one file to begin analyzing customer feedback. The AI will process your transcripts and usage data to extract insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FileRow({ file, onDelete }: { file: any; onDelete: () => void }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 group">
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
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
