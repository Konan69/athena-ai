import { Hono } from "hono";
import { chatModule } from "./chat";
import { libraryModule } from "./library";
import { AnyTRPCRouter } from "@trpc/server";
import { APP } from "../types";

interface Module {
  path: string;
  procedures?: AnyTRPCRouter;
  routes?: Hono<APP>;
  name: string;
}

export const modules: Module[] = [{ ...chatModule }, { ...libraryModule }];
