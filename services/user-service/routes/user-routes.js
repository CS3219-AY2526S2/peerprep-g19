import express from "express";

import {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
import {
  createAttempt,
  getAttemptHistory,
  getAttemptSummary,
} from "../controller/attempt-controller.js";
import {
  verifyAccessToken,
  verifyIsAdmin,
  verifyIsOwnerOrAdmin,
} from "../middleware/basic-access-control.js";

const router = express.Router();

router.get("/", verifyAccessToken, verifyIsAdmin, getAllUsers);

router.patch(
  "/:id/privilege",
  verifyAccessToken,
  verifyIsAdmin,
  updateUserPrivilege,
);

router.post("/:id/attempts", verifyAccessToken, verifyIsOwnerOrAdmin, createAttempt);

router.get("/:id/attempts", verifyAccessToken, verifyIsOwnerOrAdmin, getAttemptHistory);

router.get(
  "/:id/attempts/summary",
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  getAttemptSummary,
);

router.get("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, getUser);

router.patch("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, updateUser);

router.delete("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser);

export default router;
