import express from "express";

import {
  createHeldBillController,
  getHeldBillsController,
  getHeldBillController,
  getHeldBillNumberController,
  cancelHeldBillController,
  resumeHeldBillController,
} from "../controller/heldBillController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();


router.use(protect);


// Create held bill
router.post(
  "/",

  authorizeRoles(
    "CASHIER"
  ),

  createHeldBillController
);


// Get all
router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getHeldBillsController
);


// Get by Hold Number
// Must remain before /:id
router.get(
  "/number/:holdNumber",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getHeldBillNumberController
);


// Resume
router.post(
  "/:id/resume",

  authorizeRoles(
    "CASHIER"
  ),

  resumeHeldBillController
);


// Cancel
router.post(
  "/:id/cancel",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  cancelHeldBillController
);


// Get one
router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getHeldBillController
);


export default router;