import type { ChatMessage, ChatRequest } from "../validators";

export type ChatExtras = ChatRequest["extras"];

/**
 * Compose a user message by concatenating the base message content with any
 * pasted contents and extracted file texts. If the base message is empty
 * but extras exist, a new user message is created from extras only.
 */
export function composeUserMessage(
	baseMessage: ChatMessage | null | undefined,
	extras?: ChatExtras
): ChatMessage {
	const baseContent = baseMessage?.content?.trim() ?? "";

	const pastedCombined = (extras?.pastedContents ?? [])
		.map((s) => s.trim())
		.filter(Boolean)
		.join("\n\n");

	const filesCombined = (extras?.fileTexts ?? [])
		.map((f) => {
			const name = (f.name ?? "").trim();
			const text = (f.text ?? "").trim();
			if (!text) return "";
			return `\n\n--- ${name} ---\n${text}`;
		})
		.filter(Boolean)
		.join("");

	let composedContent = baseContent;
	if (pastedCombined) {
		composedContent = composedContent
			? `${composedContent}\n\n${pastedCombined}`
			: pastedCombined;
	}
	if (filesCombined) {
		composedContent = composedContent
			? `${composedContent}${filesCombined}`
			: filesCombined;
	}

	if (!composedContent) {
		return { role: "user", content: "" };
	}

	if (baseMessage) {
		return { ...baseMessage, content: composedContent };
	}

	return { role: "user", content: composedContent } as const;
}


