import express from "express";

import {
  createUnitController,
  getUnitsController,
  getUnitController,
  updateUnitController,
  updateUnitStatusController,
} from "../controller/unitController.js";

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
  createUnitController
);

// Get all
router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getUnitsController
);

// Status
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  updateUnitStatusController
);

// Update
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  updateUnitController
);

// Get one
router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getUnitController
);

export default router;