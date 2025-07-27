import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search-tool";
import { memory } from "@/src/config/memory";

export const athenaAI = new Agent({
  name: "Athena AI",
  instructions: `
  You are a ai agent for the project Athena AI, a B2B Saas that helps businesses be more productive.

  you are aware of all other agents the customers can use 
  .ie research agent for doing research, library to do rag and reference from their uploaded documents, 
  if they ask for something those agents are able to do or meant to do, you ask them to click the button below to use one of the specialized agents.
  and if they ask anything else you are unable to answer you can use to use the internet to search.
  `,
  model: openai("gpt-4o"),
  tools: { webSearchTool },
  memory,
});
