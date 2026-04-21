import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import visibilityRouter from "./visibility.js";
import { runPipeline } from "../pipeline/index.js";
import { PipelineError } from "../lib/errors.js";
import type { VisibilityResponse } from "../types.js";

vi.mock("../pipeline/index.js");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(visibilityRouter);
  return app;
}

describe("POST /api/visibility", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  it("returns 200 with correct shape on success", async () => {
    const mockResult: VisibilityResponse = {
      results: [{ rank: 1, brand: "Nike", reason: "Great", isUser: true }],
      userRank: 1,
      cached: false,
      queryId: "q1",
      model: "gpt-4o",
      searchedAt: "2024-01-01T00:00:00Z",
    };
    vi.mocked(runPipeline).mockResolvedValue(mockResult);

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(200);

    expect(res.body.results).toHaveLength(1);
    expect(res.body.userRank).toBe(1);
    expect(res.body.cached).toBe(false);
    expect(res.body.model).toBe("gpt-4o");
  });

  it("returns cached:true on cache hit", async () => {
    const mockResult: VisibilityResponse = {
      results: [],
      userRank: null,
      cached: true,
      queryId: "q1",
      model: "gpt-4o",
      searchedAt: "2024-01-01T00:00:00Z",
    };
    vi.mocked(runPipeline).mockResolvedValue(mockResult);

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(200);

    expect(res.body.cached).toBe(true);
  });

  it("returns 400 on empty keyword", async () => {
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "  ", store: "nike.com" })
      .expect(400);

    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 400 on missing store", async () => {
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes" })
      .expect(400);

    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 502 on pipeline upstream_failed", async () => {
    vi.mocked(runPipeline).mockRejectedValue(
      new PipelineError("upstream_failed", "Stage 2 failed"),
    );

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(502);

    expect(res.body.error).toBe("upstream_failed");
  });

  it("returns 502 on generic OpenAI error", async () => {
    vi.mocked(runPipeline).mockRejectedValue(new Error("OpenAI auth failed"));

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(502);

    expect(res.body.error).toBe("upstream_failed");
  });

  it("returns 500 on unknown error", async () => {
    vi.mocked(runPipeline).mockRejectedValue("string error");

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(500);

    expect(res.body.error).toBe("internal");
  });
});
