import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  X,
  FileText,
  ChevronDown,
  ArrowDownNarrowWide,
  Upload,
  Link,
  FolderOpen,
  Search,
  Play,
  Clock,
  Globe,
  Youtube,
  FileImage,
  Copy,
  Star,
  Trash2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  type: "pdf" | "url" | "audio";
  size?: string;
  duration?: string;
  createdAt: string;
  thumbnail?: string;
  status: "completed" | "processing" | "draft";
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Future Thinking Talk.pdf",
    type: "pdf",
    size: "45.4 KB",
    createdAt: "2 hours ago",
    status: "completed",
  },
  {
    id: "2",
    name: "AI Revolution Article",
    type: "url",
    duration: "12:34",
    createdAt: "1 day ago",
    status: "completed",
  },
  {
    id: "3",
    name: "Tech Trends 2024",
    type: "audio",
    duration: "8:45",
    createdAt: "3 days ago",
    status: "processing",
  },
  {
    id: "4",
    name: "Climate Change Report",
    type: "pdf",
    size: "2.1 MB",
    createdAt: "1 week ago",
    status: "draft",
  },
];

interface InputModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InputModal({ isOpen, onOpenChange }: InputModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  // New state for upload + metadata
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selected, setSelected] = useState("morgan");
  const [selected2, setSelected2] = useState("");
  const [selected3, setSelected3] = useState("");
  const [selected4, setSelected4] = useState("");
  const [selected5, setSelected5] = useState("");
  const [selected6, setSelected6] = useState("");

  const filteredProjects = mockProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProjectIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "url":
        return <Globe className="w-4 h-4" />;
      case "audio":
        return <Headphones className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "draft":
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-xl"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="w-full max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 [scrollbar-width:none] [-ms-overflow-style:none] overflow-x-hidden">
              <CardContent className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] overflow-x-hidden">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800 dark:bg-neutral-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-base sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                        Upload Knowledge Object
                      </h1>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-normal">
                        Add a new document to your knowledge base. PDF, DOCX,
                        TXT, and MD files up to 10MB are supported.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 -mt-2 -mr-2 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mb-6 sm:mb-8"
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
                    <TabsTrigger
                      value="upload"
                      className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-neutral-900 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-neutral-100"
                    >
                      <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Upload File</span>
                      <span className="sm:hidden">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="url"
                      className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-neutral-900 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-neutral-100"
                    >
                      <Link className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import via URL</span>
                      <span className="sm:hidden">URL</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload tab */}
                  <TabsContent value="upload" className="mt-6">
                    <AnimatePresence mode="wait">
                      {activeTab === "upload" && (
                        <motion.div
                          key="tab-upload"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-6"
                        >
                          <div
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragActive(true);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              const f = e.dataTransfer.files?.[0];
                              if (!f) return;
                              if (
                                f.size > 10 * 1024 * 1024 ||
                                !/\.(pdf|docx|txt|md)$/i.test(f.name)
                              ) {
                                return;
                              }
                              setFile(f);
                              if (!title) {
                                setTitle(f.name.replace(/\.[^/.]+$/, ""));
                              }
                            }}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-8 text-center",
                              "bg-neutral-50 dark:bg-neutral-900/50",
                              dragActive
                                ? "border-neutral-500 dark:border-neutral-500"
                                : "border-neutral-300 dark:border-neutral-700"
                            )}
                          >
                            {!file ? (
                              <>
                                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Upload className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">
                                  Drag & drop your file here
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                  PDF, DOCX, TXT, MD up to 10MB
                                </p>
                                <div>
                                  <input
                                    id="file-input"
                                    type="file"
                                    accept=".pdf,.docx,.txt,.md"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      if (
                                        f.size > 10 * 1024 * 1024 ||
                                        !/\.(pdf|docx|txt|md)$/i.test(f.name)
                                      ) {
                                        return;
                                      }
                                      setFile(f);
                                      if (!title) {
                                        setTitle(
                                          f.name.replace(/\.[^/.]+$/, "")
                                        );
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    className="border-neutral-300 dark:border-neutral-700 bg-transparent"
                                    onClick={() =>
                                      document
                                        .getElementById("file-input")
                                        ?.click()
                                    }
                                  >
                                    Browse Files
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between gap-4 text-left">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 grid place-items-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-neutral-900 dark:text-neutral-100 break-words">
                                      {file.name}
                                    </div>
                                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setFile(null)}
                                  className="text-neutral-500 hover:text-neutral-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Title
                              </Label>
                              <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a title"
                                className="mt-2 h-10 rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Description
                              </Label>
                              <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe this document..."
                                className="mt-2 min-h-[90px] rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Tags
                              </Label>
                              <div
                                className="mt-2 flex items-center flex-wrap gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5"
                                onClick={() =>
                                  document.getElementById("tag-input")?.focus()
                                }
                              >
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 text-xs"
                                  >
                                    {t}
                                    <button
                                      type="button"
                                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTags(tags.filter((x) => x !== t));
                                      }}
                                      aria-label={`Remove ${t}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                <input
                                  id="tag-input"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  placeholder={
                                    tags.length
                                      ? ""
                                      : "Type a tag and press Enter or click Add"
                                  }
                                  className="flex-1 min-w-[120px] bg-transparent outline-none h-7 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const raw = tagInput.trim();
                                      if (!raw) return;
                                      const t = raw.toLowerCase();
                                      if (tags.includes(t)) return;
                                      setTags([...tags, t]);
                                      setTagInput("");
                                    }
                                    if (
                                      e.key === "Backspace" &&
                                      !tagInput &&
                                      tags.length
                                    ) {
                                      // quick remove last tag
                                      setTags(tags.slice(0, -1));
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 ml-auto"
                                  onClick={() => {
                                    const raw = tagInput.trim();
                                    if (!raw) return;
                                    const t = raw.toLowerCase();
                                    if (tags.includes(t)) return;
                                    setTags([...tags, t]);
                                    setTagInput("");
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  {/* URL tab (website scraping concept) */}
                  <TabsContent value="url" className="mt-6">
                    <AnimatePresence mode="wait">
                      {activeTab === "url" && (
                        <motion.div
                          key="tab-url"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <div>
                              <Label
                                htmlFor="url-input"
                                className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                              >
                                Website URL
                              </Label>
                              <div className="mt-2">
                                <Input
                                  id="url-input"
                                  type="url"
                                  placeholder="https://example.com/article"
                                  value={urlInput}
                                  onChange={(e) => setUrlInput(e.target.value)}
                                  className="w-full h-12 rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                />
                              </div>
                              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                                We’ll fetch and parse the readable content from
                                the page, removing ads and navigation.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Title
                              </Label>
                              <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Optional — auto-filled after fetch"
                                className="mt-2 h-10 rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Description
                              </Label>
                              <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional summary or context..."
                                className="mt-2 min-h-[90px] rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Tags
                              </Label>
                              <div
                                className="mt-2 flex items-center flex-wrap gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5"
                                onClick={() =>
                                  document
                                    .getElementById("tag-input-url")
                                    ?.focus()
                                }
                              >
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 text-xs"
                                  >
                                    {t}
                                    <button
                                      type="button"
                                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTags(tags.filter((x) => x !== t));
                                      }}
                                      aria-label={`Remove ${t}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                <input
                                  id="tag-input-url"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  placeholder={
                                    tags.length
                                      ? ""
                                      : "Type a tag and press Enter or click Add"
                                  }
                                  className="flex-1 min-w-[120px] bg-transparent outline-none h-7 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const raw = tagInput.trim();
                                      if (!raw) return;
                                      const t = raw.toLowerCase();
                                      if (tags.includes(t)) return;
                                      setTags([...tags, t]);
                                      setTagInput("");
                                    }
                                    if (
                                      e.key === "Backspace" &&
                                      !tagInput &&
                                      tags.length
                                    ) {
                                      setTags(tags.slice(0, -1));
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 ml-auto"
                                  onClick={() => {
                                    const raw = tagInput.trim();
                                    if (!raw) return;
                                    const t = raw.toLowerCase();
                                    if (tags.includes(t)) return;
                                    setTags([...tags, t]);
                                    setTagInput("");
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>

                {/* Footer actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-5 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    variant="outline"
                    className="rounded-xl px-4 sm:px-6 h-12 border-neutral-300 dark:border-neutral-700 bg-transparent text-sm flex items-center justify-center order-2 sm:order-1"
                    onClick={() => {
                      // reset simple state and close
                      setFile(null);
                      setTitle("");
                      setDescription("");
                      setTags([]);
                      setTagInput("");
                      setUrlInput("");
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      activeTab === "upload"
                        ? !file || !title
                        : !urlInput || !title
                    }
                    className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white rounded-xl px-6 sm:px-8 h-12 font-medium order-1 sm:order-2"
                    onClick={() => {
                      // Simulate submission success
                      setFile(null);
                      setTitle("");
                      setDescription("");
                      setTags([]);
                      setTagInput("");
                      setUrlInput("");
                      onOpenChange(false);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {activeTab === "upload" ? "Upload Document" : "Import URL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <style>{`
              /* Hide scrollbar for Chrome, Safari and Opera */
              .max-h\\[85vh\\]::-webkit-scrollbar,
              .h-full::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
                background: transparent;
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
