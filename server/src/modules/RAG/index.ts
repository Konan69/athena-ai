import { protectedProcedure } from "../../trpc/base";
import { EventService } from "../events/event.service";
import { TrainingEvent } from "./events";
import { EventEmitter } from "events";


const ee = new EventEmitter();

export { default as ragService } from "./ragService";
export * from "./events";



export const trainingEvents = protectedProcedure.subscription(async function* ({ ctx }) {
	const userId = ctx.user.id;
	const queue: TrainingEvent[] = [];
	const unsub = await EventService.instance.subscribeUser(userId, (evt: TrainingEvent) => {
		queue.push(evt);
	});
	try {
		while (true) {
			const next = queue.shift();
			if (next) {
				console.log("[trainingEvents] next", next);
				yield next;
			} else {
				await new Promise((r) => setTimeout(r, 200));
			}

		}
	} finally {
		await unsub();
	}
})
