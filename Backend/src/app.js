import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/auth/adminRoutes.js";
import managerRoutes from "./routes/auth/managerRoutes.js";
import cashierRoutes from "./routes/auth/cashierRoutes.js";
import branchRoutes from "./routes/auth/branchRoutes.js";
import terminalRoutes from "./routes/Terminal/terminalRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import cashDrawerRoutes from "./routes/cashDrawerRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import heldBillRoutes from "./routes/heldBillRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
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
app.use("/api/branches", branchRoutes);
app.use("/api/terminals", terminalRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/cash-drawers", cashDrawerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/held-bills", heldBillRoutes);
app.use("/api/returns", returnRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;