import express from "express";
import { protect } from "../../middleware/authMiddleware/authMiddleware.js";
import {
  authorizeRoles,
} from "../../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("ADMIN", "MANAGER"));

router.get("/dashboard", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Manager Portal",
    user: req.user,
  });
});

export default router;