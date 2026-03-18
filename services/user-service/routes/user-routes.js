import express from "express";

import {
  deleteUser,
  getAllUsers,
  getUser,
  getUserHistory,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
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

router.get("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, getUser);

router.patch("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, updateUser);

router.delete("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser);

router.get(
  "/:id/history",
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  getUserHistory,
);

export default router;
