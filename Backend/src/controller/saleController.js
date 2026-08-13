import { z } from "zod";

import {
  createSale,
  getSales,
  getSaleById,
  getSaleByNumber,
  cancelSale,
} from "../services/saleService.js";


// ==========================================
// SALE STATUS
// ==========================================

const saleStatuses = [
  "PENDING_PAYMENT",
  "PARTIALLY_PAID",
  "COMPLETED",
  "CANCELLED",
  "VOIDED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];


// ==========================================
// CREATE SALE VALIDATION
// ==========================================

const createSaleSchema =
  z.object({
    items:
      z.array(
        z.object({
          productId:
            z.string()
              .uuid(
                "Invalid product ID"
              ),

          unitId:
            z.string()
              .uuid(
                "Invalid unit ID"
              ),

          quantity:
            z.coerce
              .number()
              .positive(
                "Quantity must be greater than zero"
              ),
        })
      )
      .min(
        1,
        "At least one product is required"
      )
      .max(
        100,
        "Maximum 100 sale lines allowed"
      ),
  });


// ==========================================
// CANCEL VALIDATION
// ==========================================

const cancelSaleSchema =
  z.object({
    reason:
      z.string()
        .trim()
        .min(
          2,
          "Cancellation reason is required"
        )
        .max(
          500,
          "Cancellation reason is too long"
        ),
  });


// ==========================================
// SALES QUERY VALIDATION
// ==========================================

const salesQuerySchema =
  z.object({
    page:
      z.coerce
        .number()
        .int()
        .positive()
        .default(1),

    limit:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    status:
      z.enum([
        "PENDING_PAYMENT",
        "PARTIALLY_PAID",
        "COMPLETED",
        "CANCELLED",
        "VOIDED",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
      ])
        .optional(),

    branchId:
      z.string()
        .uuid()
        .optional(),

    shiftId:
      z.string()
        .uuid()
        .optional(),

    cashierId:
      z.string()
        .uuid()
        .optional(),

    search:
      z.string()
        .trim()
        .min(1)
        .max(100)
        .optional(),
  });


// ==========================================
// CREATE SALE
// POST /api/sales
// ==========================================

export const createSaleController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const validatedData =
        createSaleSchema.parse(
          req.body
        );


      const sale =
        await createSale({
          user:
            req.user,

          items:
            validatedData.items,
        });


      res.status(201).json({
        success:
          true,

        message:
          "Sale created successfully. Stock has been reserved and payment is required.",

        data: {
          sale,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ==========================================
// GET ALL SALES
// GET /api/sales
// ==========================================

export const getSalesController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        salesQuerySchema.parse(
          req.query
        );


      const result =
        await getSales({
          user:
            req.user,

          status:
            query.status,

          branchId:
            query.branchId,

          shiftId:
            query.shiftId,

          cashierId:
            query.cashierId,

          search:
            query.search,

          page:
            query.page,

          limit:
            query.limit,
        });


      res.status(200).json({
        success:
          true,

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// ==========================================
// GET ONE SALE
// GET /api/sales/:id
// ==========================================

export const getSaleController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const saleId =
        z.string()
          .uuid(
            "Invalid sale ID"
          )
          .parse(
            req.params.id
          );


      const sale =
        await getSaleById({
          user:
            req.user,

          saleId,
        });


      res.status(200).json({
        success:
          true,

        data: {
          sale,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ==========================================
// GET BY SALE NUMBER
// GET /api/sales/number/:saleNumber
// ==========================================

export const getSaleNumberController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const saleNumber =
        z.string()
          .trim()
          .min(
            3,
            "Sale number is required"
          )
          .max(100)
          .parse(
            req.params.saleNumber
          );


      const sale =
        await getSaleByNumber({
          user:
            req.user,

          saleNumber,
        });


      res.status(200).json({
        success:
          true,

        data: {
          sale,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ==========================================
// CANCEL PENDING SALE
// POST /api/sales/:id/cancel
// ==========================================

export const cancelSaleController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const saleId =
        z.string()
          .uuid(
            "Invalid sale ID"
          )
          .parse(
            req.params.id
          );


      const validatedData =
        cancelSaleSchema.parse(
          req.body
        );


      const sale =
        await cancelSale({
          user:
            req.user,

          saleId,

          reason:
            validatedData.reason,
        });


      res.status(200).json({
        success:
          true,

        message:
          "Sale cancelled successfully and reserved inventory released.",

        data: {
          sale,
        },
      });

    } catch (error) {
      next(error);
    }
  };