import { libraryProcedures } from "./routes/procedures";
// import libraryRouter from "./routes";

export const libraryModule = {
  path: "/api/library",
  procedures: libraryProcedures,
  // routes: libraryRouter,
  name: "library",
};
