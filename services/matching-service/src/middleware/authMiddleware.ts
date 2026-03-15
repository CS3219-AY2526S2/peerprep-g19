import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";

const WITH_AUTH = process.env.WITH_AUTH !== "false";

export async function authenticate(
 req: Request,
 res: Response,
 next: NextFunction
) {
 if (!WITH_AUTH) {
  // In dev mode, use X-Dev-Email header to distinguish users; fall back to a default
  const devEmail = (req.headers["x-dev-email"] as string) || "test@gmail.com";
  (req as any).user = {
   email: devEmail,
   username: devEmail.split("@")[0],
  };
  return next();
 }

 try {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
   return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = await admin.auth().verifyIdToken(token);

  (req as any).user = {
   email: decoded.email,
   username: decoded.name || decoded.email?.split("@")[0],
  };

  next();
 } catch (error) {
  return res.status(401).json({ error: "Invalid or expired token" });
 }
}
