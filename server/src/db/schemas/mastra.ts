import {
  pgTable,
  text,
  jsonb,
  doublePrecision,
  timestamp,
  unique,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

export const mastraScorers = pgTable("mastra_scorers", {
  id: text().primaryKey().notNull(),
  scorerId: text().notNull(),
  traceId: text(),
  runId: text().notNull(),
  scorer: jsonb().notNull(),
  extractStepResult: jsonb(),
  analyzeStepResult: jsonb(),
  score: doublePrecision().notNull(),
  reason: text(),
  metadata: jsonb(),
  extractPrompt: text(),
  analyzePrompt: text(),
  reasonPrompt: text(),
  input: jsonb().notNull(),
  output: jsonb().notNull(),
  additionalContext: jsonb(),
  runtimeContext: jsonb(),
  entityType: text(),
  entity: jsonb(),
  entityId: text(),
  source: text().notNull(),
  resourceId: text(),
  threadId: text(),
  createdAt: timestamp({ mode: "string" }).notNull(),
  updatedAt: timestamp({ mode: "string" }).notNull(),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
  updatedAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export const mastraThreads = pgTable("mastra_threads", {
  id: text().primaryKey().notNull(),
  resourceId: text().notNull(),
  title: text().notNull(),
  metadata: text(),
  createdAt: timestamp({ mode: "string" }).notNull(),
  updatedAt: timestamp({ mode: "string" }).notNull(),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
  updatedAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export const mastraWorkflowSnapshot = pgTable(
  "mastra_workflow_snapshot",
  {
    workflowName: text("workflow_name").notNull(),
    runId: text("run_id").notNull(),
    resourceId: text(),
    snapshot: text().notNull(),
    createdAt: timestamp({ mode: "string" }).notNull(),
    updatedAt: timestamp({ mode: "string" }).notNull(),
    createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
    updatedAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    unique("mastra_workflow_snapshot_workflow_name_run_id_key").on(
      table.workflowName,
      table.runId
    ),
  ]
);

export const mastraTraces = pgTable("mastra_traces", {
  id: text().primaryKey().notNull(),
  parentSpanId: text(),
  name: text().notNull(),
  traceId: text().notNull(),
  scope: text().notNull(),
  kind: integer().notNull(),
  attributes: jsonb(),
  status: jsonb(),
  events: jsonb(),
  links: jsonb(),
  other: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  startTime: bigint({ mode: "number" }).notNull(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  endTime: bigint({ mode: "number" }).notNull(),
  createdAt: timestamp({ mode: "string" }).notNull(),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export const mastraMessages = pgTable("mastra_messages", {
  id: text().primaryKey().notNull(),
  threadId: text("thread_id").notNull(),
  content: text().notNull(),
  role: text().notNull(),
  type: text().notNull(),
  createdAt: timestamp({ mode: "string" }).notNull(),
  resourceId: text(),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export const mastraResources = pgTable("mastra_resources", {
  id: text().primaryKey().notNull(),
  workingMemory: text(),
  metadata: jsonb(),
  createdAt: timestamp({ mode: "string" }).notNull(),
  updatedAt: timestamp({ mode: "string" }).notNull(),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
  updatedAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export const mastraEvals = pgTable("mastra_evals", {
  input: text().notNull(),
  output: text().notNull(),
  result: jsonb().notNull(),
  agentName: text("agent_name").notNull(),
  metricName: text("metric_name").notNull(),
  instructions: text().notNull(),
  testInfo: jsonb("test_info"),
  globalRunId: text("global_run_id").notNull(),
  runId: text("run_id").notNull(),
  createdAt: timestamp({ mode: "string" }),
  createdAtZ: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
});

export default {
  mastraScorers,
  mastraThreads,
  mastraWorkflowSnapshot,
  mastraTraces,
  mastraMessages,
  mastraResources,
  mastraEvals,
};
