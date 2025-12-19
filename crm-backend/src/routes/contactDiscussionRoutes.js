import express from "express";
import {
  createContactDiscussion,
  getAllContactDiscussions
} from "../controllers/contactDiscussionController.js";

const router = express.Router();

router.post("/", createContactDiscussion); // POST /api/contact-discussions
router.get("/", getAllContactDiscussions); // GET  /api/contact-discussions

export default router;
