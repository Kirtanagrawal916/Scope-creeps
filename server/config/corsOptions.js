import { env } from "./env.js";

export const corsOptions = {
  origin: env.clientUrl,
  credentials: true,
};
