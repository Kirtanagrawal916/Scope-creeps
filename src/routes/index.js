import { Router } from "express";
import gmailRoutes from "./gmail.routes.js";
import aiRoutes from "./ai.routes.js";
import notificationRoutes from "./notifications.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

// Sanity-check route to confirm the server is alive (test this in Postman).
router.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.use("/gmail", gmailRoutes);
router.use("/ai", aiRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
