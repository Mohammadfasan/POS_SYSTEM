import express from "express";

import {
  createProductController,
  getProductsController,
  getProductController,
  getProductBarcodeController,
  updateProductController,
  updateProductStatusController,
} from "../controller/productController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Create product
router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  createProductController
);

// Get all products
router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getProductsController
);

// IMPORTANT:
// barcode route should be before /:id
router.get(
  "/barcode/:barcode",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getProductBarcodeController
);

// Change status
router.patch(
  "/:id/status",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  updateProductStatusController
);

// Update product
router.patch(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  updateProductController
);

// Get one product
router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getProductController
);

export default router;