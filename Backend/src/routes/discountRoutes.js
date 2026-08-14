import express from "express";

import {
  createDiscountController,
  approveDiscountController,
  getDiscountsController,
  rejectDiscountController,
} from "../controller/discountController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();


router.use(protect);


router.post(
  "/",
  authorizeRoles(
    "CASHIER"
  ),
  createDiscountController
);


router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getDiscountsController
);


router.post(
  "/:id/approve",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  approveDiscountController
);


router.post(
  "/:id/reject",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  rejectDiscountController
);


export default router;