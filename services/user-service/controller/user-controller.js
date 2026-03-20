import {
  deleteUserById,
  findAllUsers,
  findUserById,
  findUserByUsername,
  updateUserById,
  updateUserPrivilegeById,
} from "../model/firebase-repository.js";
import { setUserRoleClaim } from "../helper/firebase-auth-helper.js";

const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

export async function getUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    return res
      .status(200)
      .json({ message: "Found user", data: formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting user!" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await findAllUsers();

    return res
      .status(200)
      .json({ message: "Found users", data: users.map(formatUserResponse) });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting all users!" });
  }
}

export async function updateUser(req, res) {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "username is missing!" });
    }

    const userId = req.params.id;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const updatedUser = await updateUserById(userId, { username });

    return res.status(200).json({
      message: `Updated data for user ${userId}`,
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when updating user!" });
  }
}

export async function updateUserPrivilege(req, res) {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const updatedUser = await updateUserPrivilegeById(userId, role);
    await setUserRoleClaim(user.firebaseuuid, role);

    return res.status(200).json({
      message: `Updated privilege for user ${userId}`,
      data: formatUserResponse(updatedUser),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when updating user privilege!" });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    await deleteUserById(userId);
    return res
      .status(200)
      .json({ message: `Deleted user ${userId} successfully` });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when deleting user!" });
  }
}

export function formatUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
