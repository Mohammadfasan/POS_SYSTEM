import express from "express";

import {
  createCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
  updateCategoryStatusController,
} from "../controller/categoryController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Create
router.post(
  "/",
  authorizeRoles("ADMIN"),
  createCategoryController
);

// Get all
router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getCategoriesController
);

// Change status
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  updateCategoryStatusController
);

// Update
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  updateCategoryController
);

// Get one
router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getCategoryController
);

export default router;