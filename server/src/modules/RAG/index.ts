import { protectedProcedure } from "../../trpc/base";
import { EventService } from "../events/event.service";
import { TrainingEvent } from "./events";
import { observable } from "@trpc/server/observable";

export { default as ragService } from "./ragService";
export * from "./events";

export const trainingEvents = protectedProcedure.subscription(async ({ ctx }) => {
	const orgId = ctx.activeOrganizationId!;

	return observable<TrainingEvent>((emit) => {
		let unsubscribed = false;
		let cleanup: (() => void) | undefined;

		// Subscribe to events and emit them immediately
		EventService.instance.subscribe(orgId, (evt: TrainingEvent) => {
			if (!unsubscribed) {
				console.log(`[trainingEvents] Emitting event:`, evt);
				emit.next(evt);
			}
		}).then((cleanupFn) => {
			cleanup = cleanupFn;
		});

		const unsubscribe = () => {
			unsubscribed = true;
			if (cleanup) {
				cleanup();
			}
		};


		return unsubscribe;
	});
})
