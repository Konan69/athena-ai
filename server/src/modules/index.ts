import { chatModule } from "./chat";

export const modules = [
  // All other modules (will get global auth)
  { ...chatModule, skipAuth: false },

  // Add new modules here...
];
