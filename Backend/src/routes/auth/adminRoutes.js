import express from "express";

import {
  createSystemUser,
} from "../../controller/auth/authController.js";

import {
  getSystemUsers,
  getSystemUser,
  updateSystemUser,
  updateSystemUserStatus,
} from "../../controller/auth/adminUserController.js";

import {
  protect,
} from "../../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../../middleware/authMiddleware/roleMiddleware.js";

const router =
  express.Router();

// ======================================================
// PROTECTION
// ======================================================

router.use(protect);

router.use(
  authorizeRoles("ADMIN")
);

// ======================================================
// USER MANAGEMENT
// ======================================================

// CREATE USER
router.post(
  "/users",
  createSystemUser
);

// GET ALL USERS
router.get(
  "/users",
  getSystemUsers
);

// GET ONE USER
router.get(
  "/users/:id",
  getSystemUser
);

// CHANGE USER STATUS
// IMPORTANT: keep BEFORE /users/:id if needed
router.patch(
  "/users/:id/status",
  updateSystemUserStatus
);

// UPDATE USER
router.patch(
  "/users/:id",
  updateSystemUser
);

// ======================================================
// DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "Welcome to Admin Portal",

      user: req.user,
    });
  }
);

export default router;