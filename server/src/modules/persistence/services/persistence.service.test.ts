import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { PersistenceService } from "./persistence.service";
import {
  CheckpointData,
  PersistenceRequest,
} from "../interfaces/persistence.interface";

describe("PersistenceService", () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    persistenceService = new PersistenceService();
  });

  describe("saveCheckpoint", () => {
    it("should save a checkpoint successfully", async () => {
      const checkpoint: CheckpointData = {
        id: "test-checkpoint-1",
        workflowId: "test-workflow",
        stepId: "step-1",
        data: { key: "value", number: 42 },
        timestamp: new Date(),
        status: "pending",
      };

      const request: PersistenceRequest = { checkpoint };
      const effect = persistenceService.saveCheckpoint(request);
      const result = await Effect.runPromise(effect);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(typeof result.checkpointId).toBe("string");
      expect(result.checkpointId).toMatch(/^checkpoint_\d+$/);
    });

    it("should handle different checkpoint statuses", async () => {
      const statuses: Array<"pending" | "completed" | "failed"> = [
        "pending",
        "completed",
        "failed",
      ];

      for (const status of statuses) {
        const checkpoint: CheckpointData = {
          id: `test-checkpoint-${status}`,
          workflowId: "test-workflow",
          stepId: "step-1",
          data: { status },
          timestamp: new Date(),
          status,
        };

        const request: PersistenceRequest = { checkpoint };
        const effect = persistenceService.saveCheckpoint(request);
        const result = await Effect.runPromise(effect);

        expect(result.success).toBe(true);
        expect(result.checkpointId).toBeDefined();
      }
    });
  });

  describe("getCheckpoint", () => {
    it("should return null for non-existent checkpoint", async () => {
      const effect = persistenceService.getCheckpoint("non-existent-id");
      const result = await Effect.runPromise(effect);

      expect(result).toBeNull();
    });

    it("should handle invalid checkpoint IDs gracefully", async () => {
      const invalidIds = ["", "   ", "invalid-id-format"];

      for (const invalidId of invalidIds) {
        const effect = persistenceService.getCheckpoint(invalidId);
        const result = await Effect.runPromise(effect);

        expect(result).toBeNull();
      }
    });
  });
});
