import express from "express";

import {
  createSaleController,
  getSalesController,
  getSaleController,
  getSaleNumberController,
  cancelSaleController,
} from "../controller/saleController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();

router.use(protect);


// ======================================
// CREATE SALE
// ======================================

router.post(
  "/",

  authorizeRoles(
    "CASHIER"
  ),

  createSaleController
);


// ======================================
// GET ALL SALES
// ======================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getSalesController
);


// ======================================
// GET BY SALE NUMBER
//
// Must be BEFORE /:id
// ======================================

router.get(
  "/number/:saleNumber",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getSaleNumberController
);


// ======================================
// CANCEL PENDING SALE
// ======================================

router.post(
  "/:id/cancel",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  cancelSaleController
);


// ======================================
// GET ONE SALE
// ======================================

router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getSaleController
);


export default router;