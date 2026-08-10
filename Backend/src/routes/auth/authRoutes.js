import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshToken,
} from "../../controller/auth/authController.js";
import { protect } from "../../middleware/authMiddleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getCurrentUser);

export default router;