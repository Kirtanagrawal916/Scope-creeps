import { Router } from "express";
import { getOverview } from "../controllers/analyticsController.js";

const router = Router();

// Returns aggregate analytics (scope risk trends, reply times, etc).
router.get("/overview", getOverview);

export default router;
