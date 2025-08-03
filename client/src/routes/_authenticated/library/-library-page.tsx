import React, { useState } from "react";
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
  Book,
  BookAIcon,
  BookOpen,
  BookHeartIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/config/trpc";
import { useQuery } from "@tanstack/react-query";
import InputModal from "@/components/input-modal";

interface KnowledgeObject {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  status: "processing" | "ready" | "failed";
  tags: string[];
  createdAt: string;
  processedAt?: string;
}

export function LibraryPage() {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(
    trpc.library.getLibraryItems.queryOptions()
  );
  const [objects, setObjects] = useState<KnowledgeObject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ready" | "processing" | "failed"
  >("all");

  const filteredObjects = objects.filter((obj) => {
    const matchesSearch =
      obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter = filterStatus === "all" || obj.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleUploadComplete = (
    newObject: Omit<KnowledgeObject, "id" | "createdAt" | "status">
  ) => {
    const knowledgeObject: KnowledgeObject = {
      ...newObject,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString(),
      status: "processing",
    };
    setObjects([...objects, knowledgeObject]);
  };

  const getStatusBadge = (status: KnowledgeObject["status"]) => {
    switch (status) {
      case "ready":
        return <Badge variant="default">Ready</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getStatusIcon = (status: KnowledgeObject["status"]) => {
    switch (status) {
      case "ready":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <X className="h-4 w-4 text-red-600" />;
    }
  };

  if (objects.length === 0) {
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
            <InputModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
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
            <InputModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
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
              All ({objects.length})
            </Button>
            <Button
              variant={filterStatus === "ready" ? "default" : "outline"}
              onClick={() => setFilterStatus("ready")}
            >
              Ready ({objects.filter((o) => o.status === "ready").length})
            </Button>
            <Button
              variant={filterStatus === "processing" ? "default" : "outline"}
              onClick={() => setFilterStatus("processing")}
            >
              Processing (
              {objects.filter((o) => o.status === "processing").length})
            </Button>
            <Button
              variant={filterStatus === "failed" ? "default" : "outline"}
              onClick={() => setFilterStatus("failed")}
            >
              Failed ({objects.filter((o) => o.status === "failed").length})
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
                      {obj.fileName} • {obj.fileSize}
                    </span>
                    <span>Created {obj.createdAt}</span>
                  </div>
                  {obj.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {obj.tags.map((tag) => (
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
