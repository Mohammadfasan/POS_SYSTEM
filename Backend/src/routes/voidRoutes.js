import express from "express";

import {
  createVoidController,
  getVoidRequestsController,
  getVoidController,
  getVoidNumberController,
  approveVoidController,
  rejectVoidController,
  cancelVoidController,
  executeVoidController,
} from "../controller/voidController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();


router.use(protect);


// Create
router.post(
  "/",

  authorizeRoles(
    "CASHIER"
  ),

  createVoidController
);


// List
router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getVoidRequestsController
);


// By number
router.get(
  "/number/:voidNumber",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getVoidNumberController
);


// Approve
router.post(
  "/:id/approve",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  approveVoidController
);


// Reject
router.post(
  "/:id/reject",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  rejectVoidController
);


// Cancel
router.post(
  "/:id/cancel",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  cancelVoidController
);


// Execute
router.post(
  "/:id/execute",

  authorizeRoles(
    "CASHIER"
  ),

  executeVoidController
);


// Get one
router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getVoidController
);


export default router;