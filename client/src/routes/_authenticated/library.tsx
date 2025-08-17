import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Search,
  Clock,
  X,
  BookOpen,
  BookHeartIcon,
} from "lucide-react";
import InputModal from "@/components/input-modal";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { formatFileSize } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/library")({
  loader: async ({ context }) => {
    const trpc = context.trpc;
    const qc = context.queryClient;
    const data = await qc.ensureQueryData(
      trpc.library.getLibraryItems.queryOptions()
    );
    return { data };
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    const queryErrorResetBoundary = useQueryErrorResetBoundary();

    useEffect(() => {
      // Reset the query error boundary
      queryErrorResetBoundary.reset();
    }, [queryErrorResetBoundary]);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  },
  component: () => <LibraryPage />,
});

export function LibraryPage() {
  const { data: initial } = Route.useLoaderData();
  const itemsQuery = useQuery(trpc.library.getLibraryItems.queryOptions());
  const items = itemsQuery.data ?? initial;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ready" | "processing" | "failed"
  >("all");

  const filteredObjects = items.filter((obj) => {
    const matchesSearch =
      obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter = filterStatus === "all" || obj.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleUploadComplete = (_newObject: {
    title: string;
    description: string;
    fileSize: number;
    tags?: string[];
    uploadLink: string;
  }) => {};

  const getStatusBadge = (status: (typeof items)[0]["status"]) => {
    switch (status) {
      case "ready":
        return <Badge variant="default">Ready</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getStatusIcon = (status: (typeof items)[0]["status"]) => {
    switch (status) {
      case "ready":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <X className="h-4 w-4 text-red-600" />;
    }
  };

  if (items.length === 0) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <EmptyState
              title="Nothing in your library yet"
              description="Upload your first document to start building your knowledge base. PDF, DOCX, TXT, and MD files up to 10MB are supported."
              icons={[BookOpen, BookHeartIcon, FileText]}
              action={{
                label: "Upload Document",
                onClick: () => setIsModalOpen(true),
              }}
            />
            <div className="mt-4" />
            <InputModal
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              onComplete={handleUploadComplete}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Library</h1>
            <Button onClick={() => setIsModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            <InputModal
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              onComplete={handleUploadComplete}
            />
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge objects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              All ({items.length})
            </Button>
            <Button
              variant={filterStatus === "ready" ? "default" : "outline"}
              onClick={() => setFilterStatus("ready")}
            >
              Ready ({items.filter((o) => o.status === "ready").length})
            </Button>
            <Button
              variant={filterStatus === "processing" ? "default" : "outline"}
              onClick={() => setFilterStatus("processing")}
            >
              Processing (
              {items.filter((o) => o.status === "processing").length})
            </Button>
            <Button
              variant={filterStatus === "failed" ? "default" : "outline"}
              onClick={() => setFilterStatus("failed")}
            >
              Failed ({items.filter((o) => o.status === "failed").length})
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredObjects.map((obj) => (
              <Card key={obj.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{obj.title}</CardTitle>
                      <CardDescription>{obj.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(obj.status)}
                      {getStatusBadge(obj.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {obj.title} • {formatFileSize(obj.fileSize)}
                    </span>
                    <span>
                      Created{" "}
                      {typeof obj.createdAt === "string"
                        ? obj.createdAt
                        : obj.createdAt
                        ? new Date(obj.createdAt as string).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {obj.tags && obj.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {obj.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
