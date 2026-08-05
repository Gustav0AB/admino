import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";
import { env } from "@config/env";
import { initSocket } from "@lib/socket";

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer);

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(env.port, () => {
      console.log(`[server] Running on http://localhost:${env.port} (${env.nodeEnv})`);
      resolve();
    });
    httpServer.once("error", reject);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
