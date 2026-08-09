import { Router } from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";

const router = Router();

// Lists notifications for the current user.
router.get("/", getNotifications);

// Marks a single notification as read.
router.patch("/:id/read", markAsRead);

export default router;
