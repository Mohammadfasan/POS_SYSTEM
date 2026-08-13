import express from "express";

import {
  createBranchController,
  getBranchesController,
  getBranchController,
  updateBranchController,
  updateBranchStatusController,
  assignUserController,
  removeUserController,
  getBranchUsersController,
} from "../../controller/auth/branchController.js";

import {
  protect,
} from "../../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

// Every branch route requires login
router.use(protect);

// ==========================
// ADMIN ROUTES
// ==========================

// Create branch
router.post(
  "/",
  authorizeRoles("ADMIN"),
  createBranchController
);

// Get all branches
router.get(
  "/",
  authorizeRoles("ADMIN"),
  getBranchesController
);

// Remove user from branch
router.delete(
  "/users/:userId",
  authorizeRoles("ADMIN"),
  removeUserController
);

// Assign user to branch
router.patch(
  "/:branchId/users/:userId",
  authorizeRoles("ADMIN"),
  assignUserController
);

// Get branch users
router.get(
  "/:id/users",
  authorizeRoles("ADMIN"),
  getBranchUsersController
);

// Change branch status
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  updateBranchStatusController
);

// Update branch
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  updateBranchController
);

// Get one branch
router.get(
  "/:id",
  authorizeRoles("ADMIN"),
  getBranchController
);

export default router;