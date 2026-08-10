import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/auth/adminRoutes.js";
import managerRoutes from "./routes/auth/managerRoutes.js";
import cashierRoutes from "./routes/auth/cashierRoutes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middleware/authMiddleware/errorMiddleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartPOS API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/cashier", cashierRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;