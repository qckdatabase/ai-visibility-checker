export class PipelineError extends Error {
  constructor(
    public code: "invalid_input" | "upstream_failed" | "internal",
    message: string,
    public timings?: { stage1Ms?: number; stage2Ms?: number },
  ) {
    super(message);
    this.name = "PipelineError";
  }
}
