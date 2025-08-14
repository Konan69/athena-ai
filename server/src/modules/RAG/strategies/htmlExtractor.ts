import type { ExtractorStrategy, ExtractionResult } from "./pdfExtractor";

export class HtmlExtractor implements ExtractorStrategy {
	async extract(buffer: ArrayBuffer): Promise<ExtractionResult> {
		const decoder = new TextDecoder();
		const text = decoder.decode(new Uint8Array(buffer));
		return { text };
	}
}


