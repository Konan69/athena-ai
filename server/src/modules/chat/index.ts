import { app } from "../../server";
import chatRouter from "./chat";

app.route("/api/chat", chatRouter);
