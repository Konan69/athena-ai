// import { describe, it, expect, beforeEach } from "bun:test";
// import { Effect } from "effect";
// import { ChatService } from "./chat.service";
// import { ChatRequest } from "../interfaces/chat.interface";

// describe("ChatService", () => {
//   let chatService: ChatService;

//   beforeEach(() => {
//     chatService = new ChatService();
//   });

//   describe("generateResponse", () => {
//     it("should generate a response for a valid chat request", async () => {
//       const request: ChatRequest = {
//         messages: [
//           { role: "user", content: "What are the latest AI trends in 2024?" },
//         ],
//       };

//       const effect = chatService.generateResponse(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.message).toBeDefined();
//       expect(result.role).toBe("assistant");
//       expect(typeof result.message).toBe("string");
//       expect(result.message).toContain("AI trends in 2024");
//     });

//     it("should handle conversation with multiple messages", async () => {
//       const request: ChatRequest = {
//         messages: [
//           { role: "user", content: "Hello" },
//           { role: "assistant", content: "Hi there! How can I help you?" },
//           { role: "user", content: "Tell me about machine learning" },
//         ],
//       };

//       const effect = chatService.generateResponse(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.message).toBeDefined();
//       expect(result.role).toBe("assistant");
//       expect(typeof result.message).toBe("string");
//       expect(result.message).toContain("machine learning");
//     });

//     it("should handle system messages", async () => {
//       const request: ChatRequest = {
//         messages: [
//           { role: "system", content: "You are a helpful assistant." },
//           { role: "user", content: "What is your role?" },
//         ],
//       };

//       const effect = chatService.generateResponse(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.message).toBeDefined();
//       expect(result.role).toBe("assistant");
//       expect(typeof result.message).toBe("string");
//     });

//     it("should handle empty message content gracefully", async () => {
//       const request: ChatRequest = {
//         messages: [{ role: "user", content: "" }],
//       };

//       const effect = chatService.generateResponse(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.message).toBeDefined();
//       expect(result.role).toBe("assistant");
//       expect(typeof result.message).toBe("string");
//     });
//   });

//   describe("generateReport (deprecated)", () => {
//     it("should generate a report for a valid request", async () => {
//       const request = {
//         prompt: "AI trends in 2024",
//       };

//       const effect = chatService.generateReport(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.report).toBeDefined();
//       expect(typeof result.report).toBe("string");
//       expect(result.report).toContain("AI trends in 2024");
//       expect(result.report).toContain("# Research Report");
//     });

//     it("should handle empty prompt gracefully", async () => {
//       const request = {
//         prompt: "",
//       };

//       const effect = chatService.generateReport(request);
//       const result = await Effect.runPromise(effect);

//       expect(result).toBeDefined();
//       expect(result.report).toBeDefined();
//       expect(typeof result.report).toBe("string");
//     });

//     it("should include proper markdown structure", async () => {
//       const request = {
//         prompt: "Test topic",
//       };

//       const effect = chatService.generateReport(request);
//       const result = await Effect.runPromise(effect);

//       expect(result.report).toContain("# Research Report");
//       expect(result.report).toContain("## Topic:");
//       expect(result.report).toContain("### Executive Summary");
//       expect(result.report).toContain("### Key Findings");
//       expect(result.report).toContain("### Detailed Analysis");
//       expect(result.report).toContain("### Recommendations");
//       expect(result.report).toContain("### Conclusion");
//     });

//     it("should include timestamp in the report", async () => {
//       const request = {
//         prompt: "Test topic",
//       };

//       const effect = chatService.generateReport(request);
//       const result = await Effect.runPromise(effect);

//       expect(result.report).toMatch(
//         /Report generated at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
//       );
//     });
//   });
// });
