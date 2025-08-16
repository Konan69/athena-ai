import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { env } from "../../config/env";
import Exa from "exa-js";

// Interface for web search providers
export interface WebSearchProvider {
  search(query: string, numResults: number): Promise<WebSearchResult[]>;
  getName(): string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

// Rate limiter for Brave Search (1 RPS)
class RateLimiter {
  private lastRequestTime = 0;
  private readonly intervalMs: number;

  constructor(requestsPerSecond: number) {
    this.intervalMs = 1000 / requestsPerSecond;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.intervalMs) {
      const waitTime = this.intervalMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}

// Exa API Strategy using exa-js
export class ExaSearchProvider implements WebSearchProvider {
  private readonly exa: Exa;

  constructor() {
    this.exa = new Exa(env.EXA_API_KEY);
  }

  getName(): string {
    return "Exa";
  }

  async search(query: string, numResults: number): Promise<WebSearchResult[]> {
    try {
      const result = await this.exa.searchAndContents(query, {
        numResults,
        type: "auto", // Auto-select between neural and keyword search
        text: true,
        highlights: true,
      });

      return result.results.map((item) => ({
        title: item.title || "No title available",
        url: item.url,
        snippet:
          item.highlights?.[0] ||
          item.text?.substring(0, 200) ||
          "No snippet available",
        publishedDate: item.publishedDate,
      }));
    } catch (error) {
      console.error("Exa search failed:", error);
      throw new Error(
        `Exa search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Brave Search Strategy
export class BraveSearchProvider implements WebSearchProvider {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.search.brave.com/res/v1";
  private readonly rateLimiter = new RateLimiter(1); // 1 RPS limit

  constructor() {
    this.apiKey = env.BRAVE_API_KEY!;
  }

  getName(): string {
    return "Brave";
  }

  async search(query: string, numResults: number): Promise<WebSearchResult[]> {
    try {
      // Apply rate limiting
      await this.rateLimiter.waitIfNeeded();

      const response = await fetch(
        `${this.baseUrl}/web/search?q=${encodeURIComponent(
          query
        )}&count=${numResults}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Brave API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as any;

      return (
        data.web?.results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          snippet: result.description || "No snippet available",
          publishedDate: result.age,
        })) || []
      );
    } catch (error) {
      console.error("Brave search failed:", error);
      throw new Error(
        `Brave search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Strategy Context with configuration-based provider selection
export class WebSearchContext {
  private providers: Map<string, WebSearchProvider> = new Map();
  private configuredProvider: string;

  constructor() {
    this.configuredProvider = env.WEB_SEARCH_PROVIDER;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize all providers regardless of API keys
    // The configured provider will be validated at runtime
    this.providers.set("exa", new ExaSearchProvider());
    this.providers.set("brave", new BraveSearchProvider());
  }

  private getConfiguredProvider(): WebSearchProvider {
    const provider = this.providers.get(this.configuredProvider);
    if (!provider) {
      throw new Error(
        `Configured provider "${
          this.configuredProvider
        }" not found. Available providers: ${Array.from(
          this.providers.keys()
        ).join(", ")}`
      );
    }

    // Validate API key for the configured provider
    if (this.configuredProvider === "exa" && !env.EXA_API_KEY) {
      throw new Error("EXA_API_KEY is required when using Exa provider");
    }
    if (this.configuredProvider === "brave" && !env.BRAVE_API_KEY) {
      throw new Error("BRAVE_API_KEY is required when using Brave provider");
    }

    // Return provider with proper API key
    if (this.configuredProvider === "exa") {
      return new ExaSearchProvider();
    } else {
      return new BraveSearchProvider();
    }
  }

  async search(
    query: string,
    numResults: number
  ): Promise<{
    results: WebSearchResult[];
    provider: string;
  }> {
    const provider = this.getConfiguredProvider();
    const results = await provider.search(query, numResults);
    return {
      results,
      provider: provider.getName(),
    };
  }

  getConfiguredProviderName(): string {
    return this.configuredProvider;
  }

  getAllProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Create global search context
const webSearchContext = new WebSearchContext();

/**
 * Usage Example:
 *
 * Set your provider in environment variables:
 * WEB_SEARCH_PROVIDER="exa"  # or "brave"
 * EXA_API_KEY="your-key"     # if using exa
 * BRAVE_API_KEY="your-key"   # if using brave
 *
 * Then use the tool:
 * const results = await webSearchTool.execute({
 *   context: { query: "latest AI developments", numResults: 10 }
 * });
 *
 * The tool will automatically use the configured provider.
 */

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the web for information using the configured search provider (set via WEB_SEARCH_PROVIDER environment variable).",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    numResults: z
      .number()
      .optional()
      .describe("Number of results to return (default: 5)"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
        publishedDate: z.string().optional(),
      })
    ),
    provider: z.string().describe("The search provider used"),
    availableProviders: z
      .array(z.string())
      .describe("List of available providers"),
  }),
  execute: async ({ context }) => {
    const { query, numResults = 5 } = context;

    try {
      const { results, provider: usedProvider } = await webSearchContext.search(
        query,
        numResults
      );

      return {
        results,
        provider: usedProvider,
        availableProviders: webSearchContext.getAllProviders(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Web search failed:", errorMessage);

      throw new Error(`Web search failed: ${errorMessage}`);
    }
  },
});
