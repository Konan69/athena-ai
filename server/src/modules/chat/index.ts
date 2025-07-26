import chatRouter from "./routes";

export const chatModule = {
  path: "/api/chat",
  router: chatRouter,
  name: "chat",
};
