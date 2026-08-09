import { Router } from "express";
import { getApiMetrics } from "../controllers/apiMetricsController.js";

const router = Router();

// Returns per-endpoint request counts, success/error counts, and average
// latency, as observed by apiMetrics middleware (app.js).
router.get("/", getApiMetrics);

export default router;
