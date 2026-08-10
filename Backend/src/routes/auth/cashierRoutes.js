import express from "express";
import { protect } from "../../middleware/authMiddleware/authMiddleware.js";
import {
  authorizeRoles,
} from "../../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/dashboard",
  authorizeRoles("ADMIN", "MANAGER", "CASHIER"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to Cashier Portal",
      user: req.user,
    });
  }
);

export default router;