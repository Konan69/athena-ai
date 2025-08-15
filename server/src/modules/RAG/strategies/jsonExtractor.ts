import type { ExtractorStrategy, ExtractionResult } from "./pdfExtractor";

export class JsonExtractor implements ExtractorStrategy {
	async extract(buffer: ArrayBuffer): Promise<ExtractionResult> {
		const decoder = new TextDecoder();
		const raw = decoder.decode(new Uint8Array(buffer));
		try {
			// Validate it's JSON; if not, just return raw content
			JSON.parse(raw);
			return { text: raw };
		} catch {
			return { text: raw };
		}
	}
}



