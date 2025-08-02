import { chatProcedures } from "./routes/procedures";
import chatRouter from "./routes";

export const chatModule = {
  path: "/api/chat",
  procedures: chatProcedures,
  routes: chatRouter,
  name: "chat",
};
