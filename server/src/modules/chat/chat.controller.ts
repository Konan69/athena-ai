import { Request, Response, NextFunction } from "express";
import { Readable } from "node:stream";
import { chatRequestSchema } from "./validators";
import { chatService } from "./chat.service";

// Validation middleware
export const validateChatRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = chatRequestSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    res.status(400).json({
      error: "Validation failed",
      details: error,
    });
  }
};

// Chat handler
export const chatHandler = async (
  req: Request,
  res: any,
  next: NextFunction
): Promise<any> => {
  try {
    const stream = await chatService.processChat(req.body);

    // Return the streaming response using Mastra's built-in method
    const dataStreamResponse = stream.toDataStreamResponse();

    // Forward status and headers from the Response object
    res.status(dataStreamResponse.status || 200);
    dataStreamResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Convert the web ReadableStream to a Node.js Readable and pipe to Express
    if (dataStreamResponse.body) {
      const nodeReadable = Readable.fromWeb(dataStreamResponse.body as any);
      nodeReadable.pipe(res);
    } else {
      // If no body present, end the response
      res.end();
    }
    return;
  } catch (error) {
    console.error("Chat error:", error);

    // Handle specific error cases
    if (error instanceof Error && error.message === "Missing message content") {
      res.status(400).json({
        error: "Bad Request",
        message: "Message content is required",
      });
      return;
    }

    next(error);
  }
};
