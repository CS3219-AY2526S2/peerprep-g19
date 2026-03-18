import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

const UserModelSchema = new Schema({
  firebaseuuid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Setting default to the current date/time
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
    default: USER_ROLES.USER,
    index: true,
  },
  questionHistory: [
    {
      questionId: {
        type: String,
        required: true,
      },
      questionTitle: {
        type: String,
        required: true,
      },
    },
  ],
});

userSchema.index({ "questionHistory.questionId": 1 });

export default mongoose.model("UserModel", UserModelSchema);
