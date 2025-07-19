import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const researchStep = createStep({
  id: "conduct-research",
  description: "Conducts web research on the given topic",
  inputSchema: z.object({
    prompt: z.string().describe("The research prompt/topic"),
  }),
  outputSchema: z.object({
    findings: z.string(),
    sources: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const prompt = inputData?.prompt;
    if (!prompt) {
      throw new Error("Research prompt not provided");
    }

    const agent = mastra?.getAgent("researchAgent");
    if (!agent) {
      throw new Error("Research agent not found");
    }

    const response = await agent.stream([
      {
        role: "user",
        content: `Conduct comprehensive research on: ${prompt}
        
        Please provide detailed findings including:
        - Key facts and statistics
        - Recent developments
        - Expert opinions and analysis
        - Relevant trends and patterns
        
        Use the web search tool to gather information from multiple sources.`,
      },
    ]);

    let findings = "";
    for await (const chunk of response.textStream) {
      findings += chunk;
    }

    return {
      findings,
      sources: ["Web search results", "Expert analysis"], // TODO: Extract actual sources
    };
  },
});

const summarizeStep = createStep({
  id: "synthesize-report",
  description: "Synthesizes research findings into a comprehensive report",
  inputSchema: z.object({
    findings: z.string(),
    sources: z.array(z.string()),
    prompt: z.string(),
  }),
  outputSchema: z.object({
    report: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { findings, sources, prompt } = inputData || {};
    if (!findings || !prompt) {
      throw new Error("Research findings or prompt not provided");
    }

    const agent = mastra?.getAgent("summarizerAgent");
    if (!agent) {
      throw new Error("Summarizer agent not found");
    }

    const response = await agent.stream([
      {
        role: "user",
        content: `Create a comprehensive markdown report based on the following research findings:

Original Research Prompt: ${prompt}

Research Findings:
${findings}

Sources: ${sources.join(", ")}

Please create a well-structured report with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Trends and Insights
5. Conclusions and Recommendations

Use proper markdown formatting with headers, bullet points, and emphasis where appropriate.`,
      },
    ]);

    let report = "";
    for await (const chunk of response.textStream) {
      report += chunk;
    }

    return { report };
  },
});

const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema: z.object({
    prompt: z.string().describe("The research topic or question"),
  }),
  outputSchema: z.object({
    report: z.string(),
  }),
})
  .then(researchStep)
  .then(summarizeStep);

researchWorkflow.commit();

export { researchWorkflow };
