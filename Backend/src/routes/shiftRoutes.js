import express from "express";

import {
  openShiftController,
  closeShiftController,
  getCurrentShiftController,
  getShiftsController,
  getShiftController,
} from "../controller/shiftController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router = express.Router();

router.use(protect);


// ========================================
// OPEN SHIFT
// CASHIER ONLY
// ========================================

router.post(
  "/open",

  authorizeRoles(
    "CASHIER"
  ),

  openShiftController
);


// ========================================
// CURRENT SHIFT
//
// IMPORTANT:
// Keep this BEFORE "/:id"
// ========================================

router.get(
  "/current",

  authorizeRoles(
    "CASHIER"
  ),

  getCurrentShiftController
);


// ========================================
// GET SHIFT HISTORY
// ========================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getShiftsController
);


// ========================================
// CLOSE SHIFT
// ========================================

router.post(
  "/:id/close",

  authorizeRoles(
    "CASHIER"
  ),

  closeShiftController
);


// ========================================
// GET ONE SHIFT
// ========================================

router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getShiftController
);


export default router;