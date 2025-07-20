import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",

  client: {
    VITE_API_BASE_URL: z.string(),
    VITE_CLIENT_URL: z.string(),
  },

  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
