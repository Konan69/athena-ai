"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Search, Lightbulb, BarChart3 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface EmptyChatStateProps {
  onSuggestionClick: (suggestion: string) => void;
  threadId?: string;
}

const platformCategories = [
  {
    id: "create",
    icon: <PenTool className="h-5 w-5" />,
    name: "Create",
    description: "Generate content and creative materials",
    examples: [
      "Write a blog post about AI",
      "Create marketing copy",
      "Design a presentation",
      "Write creative fiction",
    ],
  },
  {
    id: "explore",
    icon: <Search className="h-5 w-5" />,
    name: "Explore",
    description: "Discover ideas and gather information",
    examples: [
      "Research market trends",
      "Find industry insights",
      "Discover interesting facts",
      "Gather competitive intel",
    ],
  },
  {
    id: "analyze",
    icon: <BarChart3 className="h-5 w-5" />,
    name: "Analyze",
    description: "Process information and extract insights",
    examples: [
      "Summarize an article",
      "Review a report for key points",
      "Compare products or services",
      "Create an executive summary",
    ],
  },
];

export function EmptyChatState({ onSuggestionClick }: EmptyChatStateProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "there";
  const [selectedCategory, setSelectedCategory] = useState<string>("create");

  const selectedCategoryData = platformCategories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <div className="absolute inset-0 w-full overflow-hidden">
      <div className="relative w-full flex flex-col items-center justify-start mt-28 p-6 z-10">
        {/* Heading */}
        <div className="text-center mb-5 mt-10">
          <h1 className="text-3xl font-semibold text-foreground">
            How can I help you, {userName}?
          </h1>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 justify-center">
          {platformCategories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 h-8 rounded-full px-3 py-1 bg-transparent border transition-colors ${
                selectedCategory === category.id
                  ? "border-muted-foreground/40 text-foreground"
                  : "border-muted/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="opacity-80">{category.icon}</span>
              <span className="text-xs font-medium">{category.name}</span>
            </Button>
          ))}
        </div>

        {/* Suggestions List (simple divided list) */}
        {selectedCategoryData && (
          <div className="w-full max-w-xl">
            {selectedCategoryData.examples.map((example, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(example)}
                className="w-full text-left py-3 px-2 border-b border-muted/20 hover:bg-muted/5 transition-colors"
              >
                <span className="text-sm text-muted-foreground hover:text-foreground">
                  {example}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
