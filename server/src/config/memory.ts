import { Memory } from "@mastra/memory";

export const memory = new Memory({
  // storage: new PostgresStore({
  //   connectionString: env.DATABASE_URL,
  // }),
  // options: {
  //   lastMessages: 12,
  //   threads: {
  //     generateTitle: {
  //       model: openai("gpt-4o-mini"),
  //       instructions:
  //         "Generate a concise title based on the initial user message.",
  //     },
  //   },
  // },
});
