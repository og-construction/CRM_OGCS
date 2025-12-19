import express from "express";
import { getLogs, createLog, sendEmailAndLog } from "../controllers/communicationController.js";

const router = express.Router();

router.get("/logs", getLogs);
router.post("/logs", createLog);
router.post("/email", sendEmailAndLog);

export default router;
