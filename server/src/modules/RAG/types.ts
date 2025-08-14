import type { LibraryItem } from "@/src/types/library";

export type SupportedExtractor = "pdf" | "markdown" | "html" | "json" | "text";

export interface TrainingRequest {
	userId: string;
	item: LibraryItem;
	forceExtractor?: SupportedExtractor;
}

export interface ExtractionMetadata {
	objectKey: string;
	contentType?: string;
	fileName?: string;
}


