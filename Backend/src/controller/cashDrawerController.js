import { z } from "zod";

import {
  createCashDrawer,
  getCashDrawers,
  getCashDrawerById,
  getCurrentCashDrawer,
  addCashIn,
  addCashOut,
  changeCashDrawerStatus,
  getCashDrawerTransactions,
} from "../services/cashDrawerService.js";


const createDrawerSchema =
  z.object({
    code:
      z.string()
        .min(2)
        .max(30),

    name:
      z.string()
        .min(2)
        .max(100),

    terminalId:
      z.string().uuid(),
  });


const cashMovementSchema =
  z.object({
    amount:
      z.coerce
        .number()
        .positive(),

    reason:
      z.string()
        .min(2)
        .max(500),

    referenceType:
      z.string()
        .max(50)
        .optional(),

    referenceId:
      z.string()
        .max(100)
        .optional(),
  });


const drawerStatusSchema =
  z.object({
    status:
      z.enum([
        "ACTIVE",
        "INACTIVE",
        "MAINTENANCE",
      ]),
  });


// ====================================
// CREATE
// ====================================

export const createCashDrawerController =
  async (req, res, next) => {
    try {

      const validatedData =
        createDrawerSchema.parse(
          req.body
        );

      const drawer =
        await createCashDrawer(
          validatedData
        );

      res.status(201).json({
        success: true,

        message:
          "Cash drawer created successfully",

        data: {
          drawer,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// GET ALL
// ====================================

export const getCashDrawersController =
  async (req, res, next) => {
    try {

      const drawers =
        await getCashDrawers({
          user: req.user,

          status:
            req.query.status,
        });

      res.status(200).json({
        success: true,

        count:
          drawers.length,

        data: {
          drawers,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// CURRENT
// ====================================

export const getCurrentCashDrawerController =
  async (req, res, next) => {
    try {

      const result =
        await getCurrentCashDrawer(
          req.user
        );

      res.status(200).json({
        success: true,

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// GET ONE
// ====================================

export const getCashDrawerController =
  async (req, res, next) => {
    try {

      const drawer =
        await getCashDrawerById({
          user:
            req.user,

          drawerId:
            req.params.id,
        });

      res.status(200).json({
        success: true,

        data: {
          drawer,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// CASH IN
// ====================================

export const cashInController =
  async (req, res, next) => {
    try {

      const validatedData =
        cashMovementSchema.parse(
          req.body
        );

      const result =
        await addCashIn({
          user:
            req.user,

          drawerId:
            req.params.id,

          ...validatedData,
        });

      res.status(200).json({
        success: true,

        message:
          "Cash added to drawer successfully",

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// CASH OUT
// ====================================

export const cashOutController =
  async (req, res, next) => {
    try {

      const validatedData =
        cashMovementSchema.parse(
          req.body
        );

      const result =
        await addCashOut({
          user:
            req.user,

          drawerId:
            req.params.id,

          ...validatedData,
        });

      res.status(200).json({
        success: true,

        message:
          "Cash removed from drawer successfully",

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// STATUS
// ====================================

export const updateCashDrawerStatusController =
  async (req, res, next) => {
    try {

      const { status } =
        drawerStatusSchema.parse(
          req.body
        );

      const drawer =
        await changeCashDrawerStatus({
          drawerId:
            req.params.id,

          status,
        });

      res.status(200).json({
        success: true,

        message:
          `Cash drawer status changed to ${status}`,

        data: {
          drawer,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ====================================
// TRANSACTION HISTORY
// ====================================

export const getCashDrawerTransactionsController =
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
        await getCashDrawerTransactions({
          user:
            req.user,

          drawerId:
            req.params.id,

          type:
            req.query.type,

          shiftId:
            req.query.shiftId,

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