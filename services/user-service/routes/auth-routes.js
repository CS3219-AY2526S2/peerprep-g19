import express from "express";

import { handleRegister } from "../controller/auth-controller.js";

const router = express.Router();

router.post("/register", handleRegister);

export default router;
