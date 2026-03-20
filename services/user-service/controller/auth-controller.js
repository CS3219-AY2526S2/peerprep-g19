import admin from "../config/firebase.js";
import { createUser, findUserByFirebaseUuid } from "../model/firebase-repository.js";
import { formatUserResponse } from "./user-controller.js";

// export async function handleLogin(req, res) {
//   const { email, password } = req.body;
//   if (email && password) {
//     try {
//       const user = await _findUserByEmail(email);
//       if (!user) {
//         return res.status(401).json({ message: "Wrong email and/or password" });
//       }

//       const match = await bcrypt.compare(password, user.password);
//       if (!match) {
//         return res.status(401).json({ message: "Wrong email and/or password" });
//       }

//       const accessToken = jwt.sign({
//         id: user.id,
//         role: user.role,
//       }, process.env.JWT_SECRET, {
//         expiresIn: "1d",
//       });
//       return res.status(200).json({ message: "User logged in", data: { accessToken, ...formatUserResponse(user) } });
//     } catch (err) {
//       return res.status(500).json({ message: err.message });
//     }
//   } else {
//     return res.status(400).json({ message: "Missing email and/or password" });
//   }
// }

// export async function handleVerifyToken(req, res) {
//   try {
//     const verifiedUser = req.user;
//     return res.status(200).json({ message: "Token verified", data: verifiedUser });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// }

export async function handleRegister(req, res) {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    const existingUser = await findUserByFirebaseUuid(uid);
    if (existingUser) {
      return res.status(200).json({
        message: "User already registered",
        data: formatUserResponse(existingUser),
      });
    }

    const username =
      req.body?.username ||
      req.body?.name ||
      decodedToken.name ||
      email?.split("@")[0] ||
      uid;

    await admin.auth().setCustomUserClaims(uid, { role: "user" });

    const user = await createUser({
      firebaseuuid: uid,
      email,
      username,
      role: "user",
    });

    return res.status(201).json({
      message: "User registered",
      data: formatUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
