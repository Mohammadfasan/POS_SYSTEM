import express from "express";

import {
  createPromotionController,
  getPromotionsController,
  getPromotionController,
  updatePromotionStatusController,
} from "../controller/promotionController.js";

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
    "ADMIN",
    "MANAGER"
  ),
  createPromotionController
);


router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getPromotionsController
);


router.patch(
  "/:id/status",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  updatePromotionStatusController
);


router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  getPromotionController
);


export default router;