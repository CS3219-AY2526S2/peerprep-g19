import UserModel from "./user-model.js";
import "dotenv/config";
import { connect } from "mongoose";

export async function connectToDB() {
  let mongoDBUri =
    process.env.ENV === "PROD"
      ? process.env.DB_CLOUD_URI
      : process.env.DB_LOCAL_URI;

  await connect(mongoDBUri);
}

export async function createUser(userData) {
  return new UserModel(userData).save();
}

export async function findUserByEmail(email) {
  return UserModel.findOne({ email });
}

export async function findUserByFirebaseUuid(firebaseuuid) {
  return UserModel.findOne({ firebaseuuid });
}

export async function findUserById(userId) {
  return UserModel.findById(userId);
}

export async function findUserByUsername(username) {
  return UserModel.findOne({ username });
}

export async function findUserByUsernameOrEmail(username, email) {
  return UserModel.findOne({
    $or: [{ username }, { email }],
  });
}

export async function findAllUsers() {
  return UserModel.find();
}

export async function updateUserById(userId, updates) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: updates,
    },
    { new: true }, // return the updated user
  );
}

export async function updateUserPrivilegeById(userId, role) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        role,
      },
    },
    { new: true }, // return the updated user
  );
}

export async function deleteUserById(userId) {
  return UserModel.findByIdAndDelete(userId);
}
