import {createApp} from "@/src/lib/factory";
import { upgradeWebSocket } from "hono/bun";
import WebSocketService, { type WebSocketLike, type WebSocketMessage } from "./websocket.service";
import { APP } from "@/src/types";
import { Context } from "hono";
const app = createApp();

// WebSocket upgrade route with authentication
app.get(

	upgradeWebSocket(async (c : Context<APP>) => {
		const session = c.var.session;
		const user = session.userId;

		const orgId = c.req.query("orgId");
		console.log(`[WebSocket] Authenticated connection for user: ${user}`);

		const wsService = WebSocketService.instance;

		return {
			onOpen(_event, ws) {
				console.log(`[WebSocket] Connection opened for user: ${user}`);

				// Send initial connection message
				ws.send(JSON.stringify({
					type: "event",
					payload: {
						message: "WebSocket connected",
						userId: user,
						timestamp: new Date().toISOString()
					}
				}));

				// Auto-subscribe if orgId provided
				if (orgId) {
					ws.send(JSON.stringify({
						type: "subscribe",
						orgId
					}));
				}
			},

			async onMessage(event, ws) {
				try {
					const message = JSON.parse(event.data as string) as WebSocketMessage;
					await wsService.handleMessage(ws as WebSocketLike, message);
				} catch (error) {
					console.error(`[WebSocket] Error handling message:`, error);
					ws.send(JSON.stringify({
						type: "error",
						payload: { error: "Failed to process message" }
					}));
				}
			},

			onClose() {
				console.log(`[WebSocket] Connection closed for user: ${user}`);
				wsService.handleDisconnection();
			},
		};
	})
);

// Stats endpoint for WebSocket connections
app.get("/stats", async (c) => {
	const session = c.var.session;
	if (!session) {
		return c.json({ success: false, error: "Unauthorized" }, 401);
	}

	const wsService = WebSocketService.instance;
	const stats = wsService.getStats();

	return c.json({
		success: true,
		stats
	});
});

export default app;
export { app as websocketRoute };