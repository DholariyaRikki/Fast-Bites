import { Router } from "express";
import { createMessage, getUserMessages, getAllMessages, getMessageById, replyToMessage, resolveMessage, updateMessageStatus } from "../controller/message.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

// User routes
router.post("/create", isAuthenticated, createMessage);
router.get("/my-messages", isAuthenticated, getUserMessages);

// SuperAdmin routes
router.get("/all", isAuthenticated, getAllMessages);
router.get("/:messageId", isAuthenticated, getMessageById);
router.put("/:messageId/reply", isAuthenticated, replyToMessage);
router.put("/:messageId/resolve", isAuthenticated, resolveMessage);
router.put("/:messageId/status", isAuthenticated, updateMessageStatus);

export default router;