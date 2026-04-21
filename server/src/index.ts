import "dotenv/config";
import express from "express";
import cors from "cors";
import { getEnv } from "./lib/env.js";
import visibilityRouter from "./routes/visibility.js";
import healthRouter from "./routes/health.js";

const env = getEnv();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(healthRouter);
app.use(visibilityRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(JSON.stringify({ error: "internal", message: String(err) }));
  res.status(500).json({ error: "internal", message: "An unexpected error occurred" });
});

app.listen(env.PORT, () => {
  console.log(JSON.stringify({
    event: "server_start",
    port: env.PORT,
    storeDriver: env.STORE_DRIVER,
    logLevel: env.LOG_LEVEL,
  }));
});
