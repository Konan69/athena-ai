import { Router } from "express";
import { z } from "zod";
import { Effect } from "effect";
import { PersistenceService } from "../services/persistence.service";

const router = Router();
const persistenceService = new PersistenceService();

const checkpointSchema = z.object({
  checkpoint: z.object({
    id: z.string(),
    workflowId: z.string(),
    stepId: z.string(),
    data: z.record(z.unknown()),
    timestamp: z.string().transform((str) => new Date(str)),
    status: z.enum(["pending", "completed", "failed"]),
  }),
});

router.post("/api/checkpoints", async (req, res, next) => {
  try {
    const validated = checkpointSchema.parse(req.body);

    const effect = persistenceService.saveCheckpoint(validated);
    const result = await Effect.runPromise(effect);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/api/checkpoints/:id", async (req, res, next) => {
  try {
    const checkpointId = req.params.id;

    const effect = persistenceService.getCheckpoint(checkpointId);
    const result = await Effect.runPromise(effect);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: "Checkpoint not found" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
