import type { IncomingMessage, ServerResponse } from "node:http";
import { app, ensureMigrated } from "../server/src/index.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureMigrated();
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
