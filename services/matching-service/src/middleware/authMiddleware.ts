import { Request, Response, NextFunction } from "express";
import axios from "axios";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

export async function authenticate(
 req: Request,
 res: Response,
 next: NextFunction
) {
 try {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
   return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const response = await axios.get(
   `${USER_SERVICE_URL}/auth/verify-token`,
   {
    headers: {
     Authorization: `Bearer ${token}`
    }
   }
  );

  const responseBody = response.data;
  const user = responseBody.data;

  // Guard clause to ensure the user object and email exist in the response
  if (!user || !user.email) {
    console.error("Verification successful, but the response payload is not in the expected format. User object or email is missing.", responseBody);
    return res.status(401).json({ error: "Invalid token payload: email missing." });
  }

  (req as any).user = { email: user.email, username: user.username }; // Attach user info to the request

  next();

 } catch (error) {
  if (axios.isAxiosError(error)) {
    console.error("Axios error during token verification:", error.response?.data || error.message);
  }
  return res.status(401).json({ error: "Invalid or expired token" });
 }
}