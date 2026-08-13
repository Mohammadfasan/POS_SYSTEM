import express from "express";

import {
  createReturnController,
  getReturnsController,
  getReturnController,
  getReturnNumberController,
  approveReturnController,
  rejectReturnController,
  cancelReturnController,
  processRefundController,
} from "../controller/returnController.js";

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
// CREATE RETURN REQUEST
// ======================================================

router.post(
  "/",

  authorizeRoles(
    "CASHIER"
  ),

  createReturnController
);


// ======================================================
// GET ALL
// ======================================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReturnsController
);


// ======================================================
// GET BY RETURN NUMBER
//
// Must be before /:id
// ======================================================

router.get(
  "/number/:returnNumber",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReturnNumberController
);


// ======================================================
// APPROVE
// ======================================================

router.post(
  "/:id/approve",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  approveReturnController
);


// ======================================================
// REJECT
// ======================================================

router.post(
  "/:id/reject",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  rejectReturnController
);


// ======================================================
// CANCEL
// ======================================================

router.post(
  "/:id/cancel",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  cancelReturnController
);


// ======================================================
// PROCESS REFUND
// ======================================================

router.post(
  "/:id/refund",

  authorizeRoles(
    "CASHIER"
  ),

  processRefundController
);


// ======================================================
// GET ONE
// ======================================================

router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getReturnController
);


export default router;