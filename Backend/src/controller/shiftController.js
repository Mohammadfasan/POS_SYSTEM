import { z } from "zod";

import {
  openShift,
  closeShift,
  getCurrentShift,
  getShifts,
  getShiftById,
} from "../services/shiftService.js";


// =====================================
// VALIDATION
// =====================================

const openShiftSchema = z.object({
  terminalId:
    z.string().uuid(
      "Invalid terminal ID"
    ),

  openingCash:
    z.coerce
      .number()
      .nonnegative(),

  openingNote:
    z.string()
      .max(500)
      .optional(),
});


const closeShiftSchema = z.object({
  closingCash:
    z.coerce
      .number()
      .nonnegative(),

  closingNote:
    z.string()
      .max(500)
      .optional(),
});


// =====================================
// OPEN
// =====================================

export const openShiftController =
  async (req, res, next) => {
    try {
      const validatedData =
        openShiftSchema.parse(
          req.body
        );

      const shift =
        await openShift({
          user:
            req.user,

          ...validatedData,
        });

      res.status(201).json({
        success: true,

        message:
          "Cashier shift opened successfully",

        data: {
          shift,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// =====================================
// CURRENT SHIFT
// =====================================

export const getCurrentShiftController =
  async (req, res, next) => {
    try {
      const shift =
        await getCurrentShift(
          req.user
        );

      res.status(200).json({
        success: true,

        message: shift
          ? "Active shift found"
          : "No active shift",

        data: {
          shift,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// =====================================
// CLOSE
// =====================================

export const closeShiftController =
  async (req, res, next) => {
    try {
      const validatedData =
        closeShiftSchema.parse(
          req.body
        );

      const shift =
        await closeShift({
          user:
            req.user,

          shiftId:
            req.params.id,

          ...validatedData,
        });

      res.status(200).json({
        success: true,

        message:
          "Cashier shift closed successfully",

        data: {
          shift,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// =====================================
// GET ALL
// =====================================

export const getShiftsController =
  async (req, res, next) => {
    try {

      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(req.query.limit) || 20,
            1
          ),
          100
        );

      const result =
        await getShifts({
          user:
            req.user,

          status:
            req.query.status,

          branchId:
            req.query.branchId,

          terminalId:
            req.query.terminalId,

          cashierId:
            req.query.cashierId,

          page,
          limit,
        });

      res.status(200).json({
        success: true,

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// =====================================
// GET ONE
// =====================================

export const getShiftController =
  async (req, res, next) => {
    try {

      const shift =
        await getShiftById({
          user:
            req.user,

          shiftId:
            req.params.id,
        });

      res.status(200).json({
        success: true,

        data: {
          shift,
        },
      });

    } catch (error) {
      next(error);
    }
  };