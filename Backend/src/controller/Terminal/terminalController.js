import { z } from "zod";

import {
  createTerminal,
  getAllTerminals,
  getTerminalById,
  getTerminalsByBranch,
  updateTerminal,
  changeTerminalStatus,
} from "../../services/Terminal/terminalService.js";

const createTerminalSchema = z.object({
  code: z
    .string()
    .min(2, "Terminal code is required")
    .max(20),

  name: z
    .string()
    .min(2, "Terminal name is required")
    .max(100),

  location: z
    .string()
    .max(150)
    .optional(),

  branchId: z
    .string()
    .uuid("Invalid branch ID"),
});

const updateTerminalSchema = z.object({
  code: z.string().min(2).max(20).optional(),

  name: z.string().min(2).max(100).optional(),

  location: z
    .string()
    .max(150)
    .optional(),
});

const statusSchema = z.object({
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
    "MAINTENANCE",
  ]),
});

// CREATE
export const createTerminalController =
  async (req, res, next) => {
    try {
      const validatedData =
        createTerminalSchema.parse(req.body);

      const terminal =
        await createTerminal(validatedData);

      res.status(201).json({
        success: true,
        message:
          "Terminal created successfully",
        data: {
          terminal,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET ALL
export const getTerminalsController =
  async (req, res, next) => {
    try {
      let terminals;

      // Admin can see everything
      if (req.user.role === "ADMIN") {
        terminals =
          await getAllTerminals();
      }

      // Manager can see only own branch
      else if (
        req.user.role === "MANAGER"
      ) {
        if (!req.user.branchId) {
          return res.status(400).json({
            success: false,
            message:
              "Manager is not assigned to a branch",
          });
        }

        terminals =
          await getTerminalsByBranch(
            req.user.branchId
          );
      }

      res.status(200).json({
        success: true,
        count: terminals.length,
        data: {
          terminals,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET ONE
export const getTerminalController =
  async (req, res, next) => {
    try {
      const terminal =
        await getTerminalById(
          req.params.id
        );

      // Manager cannot view another branch
      if (
        req.user.role === "MANAGER" &&
        terminal.branchId !==
          req.user.branchId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot access terminals from another branch",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          terminal,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET BY BRANCH
export const getBranchTerminalsController =
  async (req, res, next) => {
    try {
      const { branchId } = req.params;

      if (
        req.user.role === "MANAGER" &&
        req.user.branchId !== branchId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot access another branch",
        });
      }

      const terminals =
        await getTerminalsByBranch(
          branchId
        );

      res.status(200).json({
        success: true,
        count: terminals.length,
        data: {
          terminals,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// UPDATE
export const updateTerminalController =
  async (req, res, next) => {
    try {
      const validatedData =
        updateTerminalSchema.parse(
          req.body
        );

      const terminal =
        await updateTerminal(
          req.params.id,
          validatedData
        );

      res.status(200).json({
        success: true,
        message:
          "Terminal updated successfully",
        data: {
          terminal,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// STATUS
export const updateTerminalStatusController =
  async (req, res, next) => {
    try {
      const { status } =
        statusSchema.parse(req.body);

      const terminal =
        await changeTerminalStatus(
          req.params.id,
          status
        );

      res.status(200).json({
        success: true,
        message: `Terminal status changed to ${status}`,
        data: {
          terminal,
        },
      });
    } catch (error) {
      next(error);
    }
  };