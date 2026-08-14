import express from "express";

import {
  getAuditLogsController,
  getAuditLogController,
  getEntityAuditHistoryController,
  getAuditSummaryController,
} from "../controller/auditController.js";

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
// GET ALL
// ======================================================

router.get(
  "/",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getAuditLogsController
);


// ======================================================
// SUMMARY
//
// Keep before /:id
// ======================================================

router.get(
  "/summary",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getAuditSummaryController
);


// ======================================================
// ENTITY HISTORY
//
// Example:
// /entity/PRODUCT/uuid
// ======================================================

router.get(
  "/entity/:entityType/:entityId",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getEntityAuditHistoryController
);


// ======================================================
// GET ONE
// ======================================================

router.get(
  "/:id",

  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),

  getAuditLogController
);


export default router;