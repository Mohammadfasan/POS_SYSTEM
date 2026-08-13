import express from "express";

import {
  stockInController,
  stockOutController,
  getInventoriesController,
  getInventoryController,
} from "../controller/inventoryController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router = express.Router();

router.use(protect);


// Add stock
router.post(
  "/stock-in",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  stockInController
);


// Remove / adjust stock
router.post(
  "/stock-out",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  stockOutController
);


// View inventories
router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getInventoriesController
);


// Get one inventory
router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getInventoryController
);


export default router;