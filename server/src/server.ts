import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.ts";
import studentRoutes from "./routes/studentRoute.ts";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/students", studentRoutes);
app.use("/api/admin", adminDashboardRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "College Student Management API is running!",
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

void startServer();
