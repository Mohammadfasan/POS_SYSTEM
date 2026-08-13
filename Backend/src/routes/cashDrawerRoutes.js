import express from "express";

import {
  createCashDrawerController,
  getCashDrawersController,
  getCurrentCashDrawerController,
  getCashDrawerController,
  cashInController,
  cashOutController,
  updateCashDrawerStatusController,
  getCashDrawerTransactionsController,
} from "../controller/cashDrawerController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();

router.use(protect);


// ========================================
// CREATE DRAWER
// ADMIN
// ========================================

router.post(
  "/",

  authorizeRoles(
    "ADMIN"
  ),

  createCashDrawerController
);


// ========================================
// CURRENT CASHIER DRAWER
//
// MUST stay before /:id
// ========================================

router.get(
  "/current",

  authorizeRoles(
    "CASHIER"
  ),

  getCurrentCashDrawerController
);


// ========================================
// GET ALL
// ========================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getCashDrawersController
);


// ========================================
// CASH IN
// ========================================

router.post(
  "/:id/cash-in",

  authorizeRoles(
    "CASHIER"
  ),

  cashInController
);


// ========================================
// CASH OUT
// ========================================

router.post(
  "/:id/cash-out",

  authorizeRoles(
    "CASHIER"
  ),

  cashOutController
);


// ========================================
// TRANSACTIONS
// ========================================

router.get(
  "/:id/transactions",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getCashDrawerTransactionsController
);


// ========================================
// STATUS
// ========================================

router.patch(
  "/:id/status",

  authorizeRoles(
    "ADMIN"
  ),

  updateCashDrawerStatusController
);


// ========================================
// GET ONE
// ========================================

router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getCashDrawerController
);


export default router;