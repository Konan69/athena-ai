import { createFactory } from "hono/factory";
import { Hono } from "hono";
import { APP } from "../types";

export const factory = createFactory<APP>();
export const createApp = () => new Hono<APP>();
