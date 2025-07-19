// import { tracer } from "./tracer";
// import { Span } from "dd-trace";

// export interface LLMSpanOptions {
//   model: string;
//   prompt: string;
//   temperature?: number;
//   maxTokens?: number;
// }

// export interface ToolSpanOptions {
//   toolName: string;
//   input: Record<string, unknown>;
// }

// export interface WorkflowSpanOptions {
//   workflowId: string;
//   stepId?: string;
//   input: Record<string, unknown>;
// }

// /**
//  * Creates a custom span for LLM calls with proper tagging.
//  */
// export function createLLMSpan(
//   operation: string,
//   options: LLMSpanOptions
// ): Span {
//   const span = tracer.startSpan("llm.call", {
//     tags: {
//       "operation.name": `${options.model}:${operation}`,
//       "llm.model": options.model,
//       "llm.temperature": options.temperature,
//       "llm.max_tokens": options.maxTokens,
//       "llm.prompt_length": options.prompt.length,
//     },
//   });

//   return span;
// }

// /**
//  * Creates a custom span for tool executions.
//  */
// export function createToolSpan(options: ToolSpanOptions): Span {
//   const span = tracer.startSpan("tool.execute", {
//     tags: {
//       "operation.name": options.toolName,
//       "tool.name": options.toolName,
//       "tool.input_size": JSON.stringify(options.input).length,
//     },
//   });

//   return span;
// }

// /**
//  * Creates a custom span for workflow executions.
//  */
// export function createWorkflowSpan(options: WorkflowSpanOptions): Span {
//   const span = tracer.startSpan("workflow.execute", {
//     tags: {
//       "operation.name": options.workflowId,
//       "workflow.id": options.workflowId,
//       "workflow.step_id": options.stepId,
//       "workflow.input_size": JSON.stringify(options.input).length,
//     },
//   });

//   return span;
// }

// /**
//  * Wraps an async function with tracing.
//  */
// export function traceAsync<T extends (...args: any[]) => Promise<any>>(
//   operationName: string,
//   fn: T,
//   tags?: Record<string, string>
// ): T {
//   return (async (...args: Parameters<T>) => {
//     const span = tracer.startSpan(operationName, { tags });
//     try {
//       const result = await fn(...args);
//       span.setTag("success", true);
//       return result;
//     } catch (error) {
//       span.setTag("error", true);
//       span.setTag(
//         "error.message",
//         error instanceof Error ? error.message : String(error)
//       );
//       throw error;
//     } finally {
//       span.finish();
//     }
//   }) as T;
// }
