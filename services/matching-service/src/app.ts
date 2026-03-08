import express from "express";
import cors from "cors";
import queueRoutes from "./routes/queueRoutes";
import { authenticate } from "./middleware/authMiddleware";


const app = express();
const version = "v1"

app.use(cors());
app.use(express.json());

app.get(`/api/${version}/health`, (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(`/api/${version}`, authenticate, queueRoutes);

export default app;