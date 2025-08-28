import { organizationProcedures } from "./routes/procedures";

export const organizationModule = {
  path: "/api/organization",
  procedures: organizationProcedures,
  name: "organization",
};
