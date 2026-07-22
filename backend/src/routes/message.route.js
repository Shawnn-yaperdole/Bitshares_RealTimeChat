import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  deleteMessage,
  deleteChat,
  getVanishMode,
  toggleVanishMode,
  leaveVanishChat,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/vanish-mode/:id", getVanishMode);
router.patch("/vanish-mode/:id", toggleVanishMode);
router.post("/vanish-leave/:id", leaveVanishChat);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.delete("/:id", deleteMessage);
router.delete("/chat/:id", deleteChat);

export default router;
