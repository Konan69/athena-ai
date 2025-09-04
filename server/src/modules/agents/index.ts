import { agentProcedures } from "./procedures";
import agentChatRouter from "./routes/chat";

export const agentModule = {
  path: "/api/agents",
  procedures: agentProcedures,
  routes: agentChatRouter,
  name: "agents",
};