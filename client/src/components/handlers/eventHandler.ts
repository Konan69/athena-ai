import React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketEvents } from "@/hooks/use-websocket-events";
import { useSessionStore } from "@/store/session.store";
import { trpc } from "@/integrations/tanstack-query/root-provider";
import type {
	LibraryProcessingEvent,
	TrainingProgressEvent
} from "@athena-ai/server/types/websocket";

const EventHandler = () => {
	const qc = useQueryClient();
	const { session } = useSessionStore();
	const orgId = session?.activeOrganizationId;

	// Subscribe to all events for the active organization
	const { isConnected } = useWebSocketEvents({
		orgId: orgId || "",
		shouldReconnect: true,
		reconnectInterval: 3000,
		reconnectAttempts: 5,
		eventTypes: [
			'processing_started',
			'processing_progress',
			'processing_completed',
			'processing_failed',
			'training_started',
			'training_progress',
			'training_completed',
			'training_failed'
		]
	});

	// Handle library processing events
	const handleLibraryEvent = (event: LibraryProcessingEvent) => {
		console.log("📡 Received library event:", event);

		switch (event.type) {
			case "processing_started": {
				qc.setQueryData(
					trpc.library.getLibraryItems.queryKey(),
					(prev: any[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((item) =>
							item.id === event.payload.libraryItemId
								? { ...item, status: "processing" as const }
								: item
						);
					}
				);
				break;
			}
			case "processing_progress": {
				// Optionally store progress in a separate cache entry if needed
				break;
			}
			case "processing_completed": {
				qc.setQueryData(
					trpc.library.getLibraryItems.queryKey(),
					(prev: any[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((item) =>
							item.id === event.payload.libraryItemId
								? { ...item, status: "ready" as const }
								: item
						);
					}
				);
				toast.success("Document is ready");
				break;
			}
			case "processing_failed": {
				qc.setQueryData(
					trpc.library.getLibraryItems.queryKey(),
					(prev: any[] | undefined) => {
						if (!Array.isArray(prev)) return prev;
						return prev.map((item) =>
							item.id === event.payload.libraryItemId
								? { ...item, status: "failed" as const }
								: item
						);
					}
				);
				if (event.payload.error) {
					toast.error(event.payload.error);
				}
				break;
			}
		}
	};

	// Handle training progress events
	const handleTrainingEvent = (event: TrainingProgressEvent) => {
		console.log("📡 Received training event:", event);

		switch (event.type) {
			case "training_started": {
				// Update agent training status if needed
				if (event.payload.agentId) {
					qc.setQueryData(
						trpc.agents.getAgents.queryKey(),
						(prev: any[] | undefined) => {
							if (!Array.isArray(prev)) return prev;
							return prev.map((agent) =>
								agent.id === event.payload.agentId
									? { ...agent, trainingStatus: "training" as const }
									: agent
							);
						}
					);
				}
				break;
			}
			case "training_progress": {
				// Update training progress
				break;
			}
			case "training_completed": {
				if (event.payload.agentId) {
					qc.setQueryData(
						trpc.agents.getAgents.queryKey(),
						(prev: any[] | undefined) => {
							if (!Array.isArray(prev)) return prev;
							return prev.map((agent) =>
								agent.id === event.payload.agentId
									? { ...agent, trainingStatus: "ready" as const }
									: agent
							);
						}
					);
				}
				toast.success("Training completed successfully");
				break;
			}
			case "training_failed": {
				if (event.payload.agentId) {
					qc.setQueryData(
						trpc.agents.getAgents.queryKey(),
						(prev: any[] | undefined) => {
							if (!Array.isArray(prev)) return prev;
							return prev.map((agent) =>
								agent.id === event.payload.agentId
									? { ...agent, trainingStatus: "failed" as const }
									: agent
							);
						}
					);
				}
				if (event.payload.error) {
					toast.error(`Training failed: ${event.payload.error}`);
				}
				break;
			}
		}
	};

	// Set up event listeners
	const { lastMessage } = useWebSocketEvents({
		orgId: orgId || "",
		eventTypes: undefined // Listen to all events
	});

	React.useEffect(() => {
		if (!lastMessage) return;

		// Handle library processing events
		if (['processing_started', 'processing_progress', 'processing_completed', 'processing_failed'].includes(lastMessage.type)) {
			handleLibraryEvent(lastMessage as LibraryProcessingEvent);
		}

		// Handle training events
		if (['training_started', 'training_progress', 'training_completed', 'training_failed'].includes(lastMessage.type)) {
			handleTrainingEvent(lastMessage as TrainingProgressEvent);
		}
	}, [lastMessage]);

	// Log connection status
	React.useEffect(() => {
		if (isConnected) {
			console.log("🔌 Event connection established for organization:", orgId);
		} else {
			console.log("🔌 Event connection disconnected");
		}
	}, [isConnected, orgId]);

	// Don't render anything - this is a behavior component
	return null;
};

export default EventHandler;