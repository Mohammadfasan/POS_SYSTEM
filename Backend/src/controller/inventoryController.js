import { z } from "zod";

import {
  stockIn,
  stockOut,
  getInventories,
  getInventoryById,
} from "../services/inventoryService.js";


const stockInSchema = z.object({
  branchId: z.string().uuid(),

  productId: z.string().uuid(),

  quantity: z.coerce
    .number()
    .positive(),

  movementType: z.enum([
    "OPENING_STOCK",
    "PURCHASE",
    "ADJUSTMENT_IN",
    "RETURN",
    "VOID",
    "TRANSFER_IN",
  ]),

  reason: z
    .string()
    .max(500)
    .optional(),

  referenceType: z
    .string()
    .max(50)
    .optional(),

  referenceId: z
    .string()
    .max(100)
    .optional(),
});


const stockOutSchema = z.object({
  branchId: z.string().uuid(),

  productId: z.string().uuid(),

  quantity: z.coerce
    .number()
    .positive(),

  movementType: z.enum([
    "ADJUSTMENT_OUT",
    "DAMAGED",
    "EXPIRED",
    "SALE",
    "TRANSFER_OUT",
  ]),

  reason: z
    .string()
    .min(2)
    .max(500),

  referenceType: z
    .string()
    .max(50)
    .optional(),

  referenceId: z
    .string()
    .max(100)
    .optional(),
});


// ====================================
// STOCK IN
// ====================================

export const stockInController =
  async (req, res, next) => {
    try {
      const validatedData =
        stockInSchema.parse(req.body);

      const result =
        await stockIn({
          ...validatedData,

          user: req.user,
        });

      res.status(200).json({
        success: true,

        message:
          "Stock added successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


// ====================================
// STOCK OUT
// ====================================

export const stockOutController =
  async (req, res, next) => {
    try {
      const validatedData =
        stockOutSchema.parse(req.body);

      const result =
        await stockOut({
          ...validatedData,

          user: req.user,
        });

      res.status(200).json({
        success: true,

        message:
          "Stock removed successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


// ====================================
// GET INVENTORY
// ====================================

export const getInventoriesController =
  async (req, res, next) => {
    try {
      const inventories =
        await getInventories({
          user: req.user,

          branchId:
            req.query.branchId,

          productId:
            req.query.productId,

          search:
            req.query.search,
        });

      res.status(200).json({
        success: true,

        count:
          inventories.length,

        data: {
          inventories,
        },
      });
    } catch (error) {
      next(error);
    }
  };


// ====================================
// GET ONE
// ====================================

export const getInventoryController =
  async (req, res, next) => {
    try {
      const inventory =
        await getInventoryById({
          user: req.user,

          inventoryId:
            req.params.id,
        });

      res.status(200).json({
        success: true,

        data: {
          inventory,
        },
      });
    } catch (error) {
      next(error);
    }
  };