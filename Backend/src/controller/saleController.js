import { z } from "zod";

import {
  createSale,
  getSales,
  getSaleById,
  getSaleByNumber,
  cancelSale,
} from "../services/saleService.js";


// ======================================================
// CREATE SALE SCHEMA
// ======================================================

const createSaleSchema = z.object({

  // ==================================================
  // SALE ITEMS
  // ==================================================

  items: z
    .array(
      z.object({

        productId: z
          .string()
          .uuid(
            "Invalid product ID"
          ),

        unitId: z
          .string()
          .uuid(
            "Invalid unit ID"
          ),

        quantity: z.coerce
          .number()
          .positive(
            "Quantity must be greater than zero"
          ),

      })
    )
    .min(
      1,
      "Sale must contain at least one item"
    )
    .max(
      100,
      "Maximum 100 items are allowed in one sale"
    ),


  // ==================================================
  // PROMOTION CODES
  //
  // Example:
  //
  // ["VIP15", "SUMMER10"]
  //
  // Auto promotions do not need to be sent here.
  // ==================================================

  promotionCodes: z
    .array(
      z
        .string()
        .trim()
        .min(
          2,
          "Promotion code is too short"
        )
        .max(
          50,
          "Promotion code is too long"
        )
    )
    .max(
      10,
      "Maximum 10 promotion codes are allowed"
    )
    .default([]),

});


// ======================================================
// SALE LIST QUERY SCHEMA
// ======================================================

const saleQuerySchema = z.object({

  // ==================================================
  // PAGINATION
  // ==================================================

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),


  // ==================================================
  // SALE STATUS
  // ==================================================

  status: z
    .enum([
      "PENDING_PAYMENT",
      "PARTIALLY_PAID",
      "COMPLETED",
      "CANCELLED",
      "VOIDED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
    ])
    .optional(),


  // ==================================================
  // FILTER BY BRANCH
  //
  // ADMIN can use any branch.
  // MANAGER is restricted by service.
  // ==================================================

  branchId: z
    .string()
    .uuid(
      "Invalid branch ID"
    )
    .optional(),


  // ==================================================
  // FILTER BY SHIFT
  // ==================================================

  shiftId: z
    .string()
    .uuid(
      "Invalid shift ID"
    )
    .optional(),


  // ==================================================
  // FILTER BY CASHIER
  // ==================================================

  cashierId: z
    .string()
    .uuid(
      "Invalid cashier ID"
    )
    .optional(),


  // ==================================================
  // SEARCH
  //
  // saleNumber / invoiceNumber
  // ==================================================

  search: z
    .string()
    .trim()
    .max(
      150,
      "Search value is too long"
    )
    .optional(),

});


// ======================================================
// CANCEL SALE SCHEMA
// ======================================================

const cancelSaleSchema = z.object({

  reason: z
    .string()
    .trim()
    .min(
      2,
      "Cancellation reason is required"
    )
    .max(
      500,
      "Cancellation reason cannot exceed 500 characters"
    ),

});


// ======================================================
// CREATE SALE
//
// POST /api/sales
//
// CASHIER
// ======================================================

export const createSaleController = async (
  req,
  res,
  next
) => {

  try {

    // ==================================================
    // VALIDATE BODY
    // ==================================================

    const data =
      createSaleSchema.parse(
        req.body
      );


    // ==================================================
    // CREATE SALE
    //
    // Promotion engine runs inside saleService.
    //
    // sourceHeldBillId is NOT accepted from frontend.
    //
    // HeldBill service calls createSale()
    // internally when resuming a held bill.
    // ==================================================

    const sale =
      await createSale({

        user:
          req.user,

        items:
          data.items,

        promotionCodes:
          data.promotionCodes,

      });


    // ==================================================
    // RESPONSE
    // ==================================================

    return res
      .status(201)
      .json({

        success:
          true,

        message:
          "Sale created successfully",

        data: {
          sale,
        },

      });

  } catch (error) {

    next(error);
  }
};


// ======================================================
// GET ALL SALES
//
// GET /api/sales
//
// ADMIN
// MANAGER
// CASHIER
// ======================================================

export const getSalesController = async (
  req,
  res,
  next
) => {

  try {

    // ==================================================
    // VALIDATE QUERY
    // ==================================================

    const query =
      saleQuerySchema.parse(
        req.query
      );


    // ==================================================
    // SERVICE
    // ==================================================

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


    // ==================================================
    // RESPONSE
    // ==================================================

    return res
      .status(200)
      .json({

        success:
          true,

        data:
          result,

      });

  } catch (error) {

    next(error);
  }
};


// ======================================================
// GET SALE BY ID
//
// GET /api/sales/:id
// ======================================================

export const getSaleController = async (
  req,
  res,
  next
) => {

  try {

    // ==================================================
    // VALIDATE SALE ID
    // ==================================================

    const saleId =
      z
        .string()
        .uuid(
          "Invalid sale ID"
        )
        .parse(
          req.params.id
        );


    // ==================================================
    // SERVICE
    // ==================================================

    const sale =
      await getSaleById({

        user:
          req.user,

        saleId,

      });


    // ==================================================
    // RESPONSE
    // ==================================================

    return res
      .status(200)
      .json({

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


// ======================================================
// GET SALE BY SALE NUMBER
//
// GET /api/sales/number/:saleNumber
//
// Example:
// SL-COL001-20260813-ABCD1234
// ======================================================

export const getSaleNumberController = async (
  req,
  res,
  next
) => {

  try {

    // ==================================================
    // VALIDATE SALE NUMBER
    // ==================================================

    const saleNumber =
      z
        .string()
        .trim()
        .min(
          3,
          "Sale number is required"
        )
        .max(
          150,
          "Sale number is too long"
        )
        .parse(
          req.params.saleNumber
        );


    // ==================================================
    // SERVICE
    // ==================================================

    const sale =
      await getSaleByNumber({

        user:
          req.user,

        saleNumber,

      });


    // ==================================================
    // RESPONSE
    // ==================================================

    return res
      .status(200)
      .json({

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


// ======================================================
// CANCEL SALE
//
// POST /api/sales/:id/cancel
//
// Only PENDING_PAYMENT sale with no completed payment.
//
// Stock reservation will be released
// inside saleService.
// ======================================================

export const cancelSaleController = async (
  req,
  res,
  next
) => {

  try {

    // ==================================================
    // VALIDATE SALE ID
    // ==================================================

    const saleId =
      z
        .string()
        .uuid(
          "Invalid sale ID"
        )
        .parse(
          req.params.id
        );


    // ==================================================
    // VALIDATE BODY
    // ==================================================

    const data =
      cancelSaleSchema.parse(
        req.body
      );


    // ==================================================
    // SERVICE
    // ==================================================

    const sale =
      await cancelSale({

        user:
          req.user,

        saleId,

        reason:
          data.reason,

      });


    // ==================================================
    // RESPONSE
    // ==================================================

    return res
      .status(200)
      .json({

        success:
          true,

        message:
          "Sale cancelled successfully",

        data: {
          sale,
        },

      });

  } catch (error) {

    next(error);
  }
};