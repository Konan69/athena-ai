import { extractText } from "unpdf";

export interface ExtractionResult {
	text: string;
}

export interface ExtractorStrategy {
	extract(buffer: ArrayBuffer): Promise<ExtractionResult>;
}

export class PdfExtractor implements ExtractorStrategy {
	async extract(buffer: ArrayBuffer): Promise<ExtractionResult> {
		const parsed = await extractText(buffer);
		const text = parsed.text.map((page) => page).join("\n");
		return { text };
	}
}



