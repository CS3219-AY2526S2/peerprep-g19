import express from "express";
import { joinQueue, leaveQueue } from "../controllers/queueController";

const router = express.Router();

router.post("/queue/join", joinQueue);
router.post("/queue/leave", leaveQueue);

export default router;