import express from "express";

import {
  getNotificationsController,
  getUnreadCountController,
  getNotificationController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../controller/notificationController.js";

import {
  protect,
} from "../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../middleware/authMiddleware/roleMiddleware.js";


const router =
  express.Router();


router.use(
  protect
);


// ======================================================
// ALL USERS CAN READ THEIR OWN NOTIFICATIONS
// ======================================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getNotificationsController
);


// ======================================================
// UNREAD COUNT
//
// Keep before /:id
// ======================================================

router.get(
  "/unread-count",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  getUnreadCountController
);


// ======================================================
// MARK ALL READ
//
// Keep before /:id
// ======================================================

router.patch(
  "/read-all",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  markAllNotificationsReadController
);


// ======================================================
// MARK ONE READ
// ======================================================

router.patch(
  "/:id/read",

  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "CASHIER"
  ),

  markNotificationReadController
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

  getNotificationController
);


export default router;