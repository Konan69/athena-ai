import { z } from "zod";


export const RAGStage = z.enum([
	"started",
	"chunking",
	"embedding",
	"indexing",
	"completed",
	"failed",
]);

export const baseEvent = z.object({
	jobId: z.string(),
	orgId: z.string(),
	createdAt: z.string().datetime(),
});

export const jobStartedEvent = baseEvent.extend({
	type: z.literal("job_started"),
	totalSteps: z.number().int().positive(),
	title: z.string(),
});

export const jobProgressEvent = baseEvent.extend({
	type: z.literal("job_progress"),
	stage: RAGStage,
	currentStep: z.number().int().nonnegative(),
	totalSteps: z.number().int().positive(),
	percent: z.number().min(0).max(100),
	message: z.string().optional(),
});

export const jobCompletedEvent = baseEvent.extend({
	type: z.literal("job_completed"),
	durationMs: z.number().int().nonnegative(),
});

export const jobFailedEvent = baseEvent.extend({
	type: z.literal("job_failed"),
	error: z.object({
		name: z.string(),
		message: z.string(),
		retryable: z.boolean().default(false),
	}),
});

export const TrainingEvent = z.discriminatedUnion("type", [
	jobStartedEvent,
	jobProgressEvent,
	jobCompletedEvent,
	jobFailedEvent,
]);

export type TrainingEvent = z.infer<typeof TrainingEvent>;
export type JobStartedEvent = z.infer<typeof jobStartedEvent>;
export type JobProgressEvent = z.infer<typeof jobProgressEvent>;
export type JobCompletedEvent = z.infer<typeof jobCompletedEvent>;
export type JobFailedEvent = z.infer<typeof jobFailedEvent>;


