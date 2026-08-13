import express from "express";

import {
  getStockMovementsController,
} from "../controller/stockMovementController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router = express.Router();

router.use(protect);


router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getStockMovementsController
);


export default router;