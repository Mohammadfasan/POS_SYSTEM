import express from "express";

import {
  processPaymentController,
  getSalePaymentsController,
  getPaymentController,
} from "../controller/paymentController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();

router.use(protect);


// Process payment
router.post(
  "/",

  authorizeRoles(
    "CASHIER"
  ),

  processPaymentController
);


// Get payments belonging to a sale
router.get(
  "/sale/:saleId",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getSalePaymentsController
);


// Get one payment
router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getPaymentController
);


export default router;