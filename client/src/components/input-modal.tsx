import { useState, useEffect } from "react";
import { UploadTab } from "./input-modal/upload-tab.tsx";
import { UrlTab } from "./input-modal/url-tab.tsx";
import { TextSnippetTab } from "./input-modal/text-snippet-tab.tsx";
import { useUploadLibraryItem } from "./input-modal/useUploadLibraryItem";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Link as LinkIcon, FileText } from "lucide-react";

interface InputModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (item: {
    title: string;
    description: string;
    fileSize: number;
    tags?: string[];
    uploadLink: string;
  }) => void;
}

export default function InputModal({
  isOpen,
  onOpenChange,
  onComplete,
}: InputModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const { isSubmitting, handleUploadSubmit, abortUpload, resetState } = useUploadLibraryItem(
    {
      onComplete,
      close: () => onOpenChange(false),
    }
  );

  // Handle abort event from upload tab
  useEffect(() => {
    const handleAbort = () => {
      abortUpload?.();
    };
    
    window.addEventListener('abort-upload', handleAbort);
    return () => {
      window.removeEventListener('abort-upload', handleAbort);
    };
  }, [abortUpload]);

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
                  <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
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
                      <LinkIcon className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Web Crawl</span>
                      <span className="sm:hidden">Web</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-neutral-900 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-neutral-100"
                    >
                      <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Text Snippet</span>
                      <span className="sm:hidden">Text</span>
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
                        >
                          <UploadTab
                            isSubmitting={isSubmitting}
                            onSubmit={async (values) => {
                              await handleUploadSubmit({
                                file: values.file,
                                title: values.title,
                                description: values.description,
                                tags: values.tags,
                              });
                            }}
                            onCancel={() => onOpenChange(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  {/* URL tab */}
                  <TabsContent value="url" className="mt-6">
                    <AnimatePresence mode="wait">
                      {activeTab === "url" && (
                        <motion.div
                          key="tab-url"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <UrlTab
                            isSubmitting={isSubmitting}
                            onSubmit={async () => {
                              // TODO: implement URL import flow when backend is ready
                            }}
                            onCancel={() => onOpenChange(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  {/* Text snippet tab */}
                  <TabsContent value="text" className="mt-6">
                    <AnimatePresence mode="wait">
                      {activeTab === "text" && (
                        <motion.div
                          key="tab-text"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <TextSnippetTab
                            isSubmitting={isSubmitting}
                            onSubmit={async () => {
                              // TODO: implement text snippet import flow when backend is ready
                            }}
                            onCancel={() => onOpenChange(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>

                {/* Tab forms handle their own submit buttons */}
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
