import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function start() {
  // connectDB() never throws — it warns and continues if MongoDB isn't
  // configured or unreachable, so the server always starts.
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

start();
