import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getEnv } from "./lib/env.js";
import visibilityRouter from "./routes/visibility.js";
import healthRouter from "./routes/health.js";
import { migrate } from "./db/migrate.js";
import { adminAuth } from "./middleware/adminAuth.js";
import loginRouter from "./routes/admin/login.js";
import logoutRouter from "./routes/admin/logout.js";
import dashboardRouter from "./routes/admin/dashboard.js";
import queriesRouter from "./routes/admin/queries.js";
import keywordsRouter from "./routes/admin/keywords.js";
import storesRouter from "./routes/admin/stores.js";
import configRouter from "./routes/admin/config.js";

const env = getEnv();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(healthRouter);
app.use(visibilityRouter);

// Admin auth routes (no auth required)
app.use("/api/admin", loginRouter);
app.use("/api/admin", logoutRouter);

// Protected admin routes (auth required)
app.use("/api/admin", adminAuth, dashboardRouter);
app.use("/api/admin", adminAuth, queriesRouter);
app.use("/api/admin", adminAuth, keywordsRouter);
app.use("/api/admin", adminAuth, storesRouter);
app.use("/api/admin", adminAuth, configRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(JSON.stringify({ error: "internal", message: String(err) }));
  res.status(500).json({ error: "internal", message: "An unexpected error occurred" });
});

app.listen(env.PORT, async () => {
  if (env.STORE_DRIVER === "postgres") {
    await migrate();
  }
  console.log(JSON.stringify({
    event: "server_start",
    port: env.PORT,
    storeDriver: env.STORE_DRIVER,
    logLevel: env.LOG_LEVEL,
  }));
});
