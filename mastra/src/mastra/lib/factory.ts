import prompts from "../prompts";

function promptFactory(promptName: "rag" | "athena" | "base"): string {
	const base = prompts.basePrompt;
	let result: string;

	switch (promptName) {
		case "base":
			result = base;
			break;
		case "rag":
			result = prompts.ragPrompt
				.replace("{{base}}", base)
				.replace("{{current_date}}", new Date().toLocaleDateString());
			break;
		case "athena":
			result = prompts.athenaPrompt
				.replace("{{base}}", base)
				.replace("{{current_date}}", new Date().toLocaleDateString());
			break;
	}

	return result;
}

export function getPrompt(agent: "rag" | "athena" | "base"): string {
	return promptFactory(agent);
}

export const ragPrompt = getPrompt("rag");
export const athenaPrompt = getPrompt("athena");
export const basePrompt = getPrompt("base");