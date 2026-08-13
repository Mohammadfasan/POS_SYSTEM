import express from "express";

import {
  getReceiptBySaleController,
  getReceiptByInvoiceController,
  getThermalReceiptController,
} from "../controller/receiptController.js";

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
// THERMAL RECEIPT
//
// Keep this before the normal sale receipt endpoint
// ======================================================

router.get(
  "/sale/:saleId/text",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getThermalReceiptController
);


// ======================================================
// RECEIPT BY SALE ID
// ======================================================

router.get(
  "/sale/:saleId",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReceiptBySaleController
);


// ======================================================
// RECEIPT BY INVOICE NUMBER
// ======================================================

router.get(
  "/invoice/:invoiceNumber",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReceiptByInvoiceController
);


export default router;