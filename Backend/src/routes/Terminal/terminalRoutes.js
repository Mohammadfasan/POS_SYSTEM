import express from "express";

import {
  createTerminalController,
  getTerminalsController,
  getTerminalController,
  updateTerminalController,
  updateTerminalStatusController,
} from "../../controller/Terminal/terminalController.js";

import {
  protect,
} from "../../middleware/authMiddleware/authMiddleware.js";

import {
  authorizeRoles,
} from "../../middleware/authMiddleware/roleMiddleware.js";

const router = express.Router();

// All terminal routes need authentication
router.use(protect);

// Create terminal
router.post(
  "/",
  authorizeRoles("ADMIN"),
  createTerminalController
);

// Get terminals
router.get(
  "/",
  authorizeRoles("ADMIN", "MANAGER"),
  getTerminalsController
);

// Update terminal status
// Put this BEFORE /:id
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  updateTerminalStatusController
);

// Update terminal
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  updateTerminalController
);

// Get one terminal
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  getTerminalController
);

export default router;