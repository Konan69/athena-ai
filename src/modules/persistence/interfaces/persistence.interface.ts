export interface CheckpointData {
  id: string;
  workflowId: string;
  stepId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
}

export interface PersistenceRequest {
  checkpoint: CheckpointData;
}

export interface PersistenceResponse {
  success: boolean;
  checkpointId: string;
}
