import chatRouter from "./routes/routes";

export const chatModule = {
  path: "/api/chat",
  router: chatRouter,
  name: "chat",
};
