import express from "express";

import {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
import {
  verifyAccessToken,
  verifyIsAdmin,
  verifyIsOwnerOrAdmin,
} from "../middleware/basic-access-control.js";

const router = express.Router();

// Authenticate all /users routes once, then apply per-route authorization.
router.use(verifyAccessToken);

router.get("/", verifyIsAdmin, getAllUsers);

router.patch("/:id/privilege", verifyIsAdmin, updateUserPrivilege);

router.get("/:id", verifyIsOwnerOrAdmin, getUser);

router.patch("/:id", verifyIsOwnerOrAdmin, updateUser);

router.delete("/:id", verifyIsOwnerOrAdmin, deleteUser);

export default router;
