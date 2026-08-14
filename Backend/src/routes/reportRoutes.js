import express from "express";

import {
  getDashboardController,
  getSalesReportController,
  getTopProductsController,
  getPaymentReportController,
  getInventoryReportController,
  getCashierReportController,
  getReturnsReportController,
  getVoidReportController,
  getDiscountReportController,
} from "../controller/reportController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();


router.use(protect);


// ======================================================
// DASHBOARD
// ======================================================

router.get(
  "/dashboard",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getDashboardController
);


// ======================================================
// SALES
// ======================================================

router.get(
  "/sales",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getSalesReportController
);


// ======================================================
// TOP PRODUCTS
// ======================================================

router.get(
  "/top-products",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getTopProductsController
);


// ======================================================
// PAYMENTS
// ======================================================

router.get(
  "/payments",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getPaymentReportController
);


// ======================================================
// INVENTORY
// ======================================================

router.get(
  "/inventory",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getInventoryReportController
);


// ======================================================
// CASHIERS
// ======================================================

router.get(
  "/cashiers",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getCashierReportController
);


// ======================================================
// RETURNS
// ======================================================

router.get(
  "/returns",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReturnsReportController
);


// ======================================================
// VOIDS
// ======================================================

router.get(
  "/voids",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getVoidReportController
);


// ======================================================
// DISCOUNTS
// ======================================================

router.get(
  "/discounts",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getDiscountReportController
);


export default router;