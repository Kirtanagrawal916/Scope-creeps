import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { corsOptions } from "./config/corsOptions.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security headers (sensible defaults for an API).
app.use(helmet());

// Only the configured frontend origin may call this API, with cookies allowed.
app.use(cors(corsOptions));

// HTTP request logging — concise in dev, standard Apache format in prod.
app.use(morgan(env.isDev ? "dev" : "combined"));

// Parses incoming JSON request bodies.
app.use(express.json());

// All API routes are mounted under /api.
app.use("/api", routes);

// 404s for unmatched routes.
app.use(notFound);

// Must be the last middleware — catches every error passed via next(err).
app.use(errorHandler);

export default app;
