import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLibraryProcessingEvents } from '@/hooks/use-websocket-events';

interface LibraryItemStatusProps {
	libraryItemId: string;
	orgId: string;
	currentStatus: 'ready' | 'processing' | 'failed' | 'pending';
	onStatusChange?: (newStatus: 'ready' | 'processing' | 'failed' | 'pending') => void;
}

export function LibraryItemStatus({
	libraryItemId,
	orgId,
	currentStatus,
	onStatusChange
}: LibraryItemStatusProps) {
	const [status, setStatus] = React.useState(currentStatus);
	const [progress, setProgress] = React.useState<number | null>(null);

	// Subscribe to WebSocket events for this library item
	const { lastMessage } = useLibraryProcessingEvents(orgId, libraryItemId);

	React.useEffect(() => {
		if (!lastMessage) return;

		switch (lastMessage.type) {
			case 'processing_started':
				setStatus('processing');
				onStatusChange?.('processing');
				break;
			case 'processing_progress':
				setStatus('processing');
				setProgress(lastMessage.payload.progress || null);
				onStatusChange?.('processing');
				break;
			case 'processing_completed':
				setStatus('ready');
				setProgress(null);
				onStatusChange?.('ready');
				break;
			case 'processing_failed':
				setStatus('failed');
				setProgress(null);
				onStatusChange?.('failed');
				break;
		}
	}, [lastMessage, onStatusChange]);

	const getStatusVariant = () => {
		switch (status) {
			case 'ready':
				return 'default';
			case 'processing':
				return 'secondary';
			case 'failed':
				return 'destructive';
			case 'pending':
				return 'outline';
			default:
				return 'outline';
		}
	};

	const getStatusText = () => {
		switch (status) {
			case 'ready':
				return 'Ready';
			case 'processing':
				return progress !== null ? `Processing (${progress}%)` : 'Processing...';
			case 'failed':
				return 'Failed';
			case 'pending':
				return 'Pending';
			default:
				return 'Unknown';
		}
	};

	return (
		<Badge variant={getStatusVariant() as any}>
			{getStatusText()}
		</Badge>
	);
}

// Hook for managing WebSocket connection state
export function useWebSocketConnection(orgId: string) {
	const { isConnected } = useLibraryProcessingEvents(orgId);
	return { isConnected };
}