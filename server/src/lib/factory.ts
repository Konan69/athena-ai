import { createFactory } from "hono/factory";
import { Hono } from "hono";
import { APP, MastraRuntimeContext } from "../types";
import { RuntimeContext } from "@mastra/core/di";

export const factory = createFactory<APP>();
export const createApp = () => new Hono<APP>();

export const createRuntimeContext = () => new RuntimeContext<MastraRuntimeContext>();