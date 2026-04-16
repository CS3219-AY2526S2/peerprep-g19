import express from "express";

import {
	handleForgotPassword,
	handleRegister,
} from "../controller/auth-controller.js";

const router = express.Router();

router.post("/register", handleRegister);
router.post("/forgot-password", handleForgotPassword);

export default router;
