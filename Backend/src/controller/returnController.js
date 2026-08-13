import { z } from "zod";

import {
  createReturnRequest,
  getReturns,
  getReturnById,
  getReturnByNumber,
  approveReturn,
  rejectReturn,
  cancelReturn,
  processReturnRefund,
} from "../services/returnService.js";


// ======================================================
// CREATE RETURN
// ======================================================

const createReturnSchema =
  z.object({

    saleId:
      z.string()
        .uuid(
          "Invalid sale ID"
        ),


    items:
      z.array(

        z.object({

          saleItemId:
            z.string()
              .uuid(
                "Invalid sale item ID"
              ),

          quantity:
            z.coerce
              .number()
              .positive(
                "Return quantity must be greater than zero"
              ),

          reason:
            z.string()
              .trim()
              .max(500)
              .optional(),

          restock:
            z.boolean()
              .default(true),
        })
      )
      .min(
        1,
        "At least one return item is required"
      )
      .max(
        100,
        "Maximum 100 return items allowed"
      ),


    note:
      z.string()
        .trim()
        .max(500)
        .optional(),
  });


// ======================================================
// LIST
// ======================================================

const returnQuerySchema =
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
        "PENDING",
        "APPROVED",
        "PROCESSING",
        "REJECTED",
        "COMPLETED",
        "CANCELLED",
      ])
      .optional(),

    branchId:
      z.string()
        .uuid()
        .optional(),

    saleId:
      z.string()
        .uuid()
        .optional(),

    search:
      z.string()
        .trim()
        .max(150)
        .optional(),
  });


// ======================================================
// REJECT
// ======================================================

const rejectSchema =
  z.object({

    reason:
      z.string()
        .trim()
        .min(
          2,
          "Rejection reason is required"
        )
        .max(500),
  });


// ======================================================
// CANCEL
// ======================================================

const cancelSchema =
  z.object({

    reason:
      z.string()
        .trim()
        .min(
          2,
          "Cancellation reason is required"
        )
        .max(500),
  });


// ======================================================
// REFUND
// ======================================================

const refundSchema =
  z.object({

    refunds:
      z.array(

        z.object({

          paymentId:
            z.string()
              .uuid(
                "Invalid payment ID"
              ),

          amount:
            z.coerce
              .number()
              .positive(
                "Refund amount must be greater than zero"
              ),

          transactionReference:
            z.string()
              .trim()
              .max(150)
              .optional(),

          note:
            z.string()
              .trim()
              .max(500)
              .optional(),
        })
      )
      .max(10)
      .default([]),
  });


// ======================================================
// CREATE
// POST /api/returns
// ======================================================

export const createReturnController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        createReturnSchema.parse(
          req.body
        );


      const saleReturn =
        await createReturnRequest({

          user:
            req.user,

          saleId:
            data.saleId,

          items:
            data.items,

          note:
            data.note,
        });


      res.status(201).json({

        success:
          true,

        message:
          "Return request created successfully and is waiting for approval",

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET ALL
// ======================================================

export const getReturnsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        returnQuerySchema.parse(
          req.query
        );


      const result =
        await getReturns({

          user:
            req.user,

          status:
            query.status,

          branchId:
            query.branchId,

          saleId:
            query.saleId,

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


// ======================================================
// GET ONE
// ======================================================

export const getReturnController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnId =
        z.string()
          .uuid(
            "Invalid return ID"
          )
          .parse(
            req.params.id
          );


      const saleReturn =
        await getReturnById({

          user:
            req.user,

          returnId,
        });


      res.status(200).json({

        success:
          true,

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET BY NUMBER
// ======================================================

export const getReturnNumberController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnNumber =
        z.string()
          .trim()
          .min(3)
          .max(150)
          .parse(
            req.params.returnNumber
          );


      const saleReturn =
        await getReturnByNumber({

          user:
            req.user,

          returnNumber,
        });


      res.status(200).json({

        success:
          true,

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// APPROVE
// ======================================================

export const approveReturnController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const saleReturn =
        await approveReturn({

          user:
            req.user,

          returnId,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Return approved successfully",

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// REJECT
// ======================================================

export const rejectReturnController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        rejectSchema.parse(
          req.body
        );


      const saleReturn =
        await rejectReturn({

          user:
            req.user,

          returnId,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Return rejected successfully",

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// CANCEL
// ======================================================

export const cancelReturnController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        cancelSchema.parse(
          req.body
        );


      const saleReturn =
        await cancelReturn({

          user:
            req.user,

          returnId,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Return cancelled successfully",

        data: {
          saleReturn,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// PROCESS REFUND
// ======================================================

export const processRefundController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const returnId =
        z.string()
          .uuid(
            "Invalid return ID"
          )
          .parse(
            req.params.id
          );


      const data =
        refundSchema.parse(
          req.body
        );


      const idempotencyKey =
        req.get(
          "Idempotency-Key"
        );


      const result =
        await processReturnRefund({

          user:
            req.user,

          returnId,

          refunds:
            data.refunds,

          idempotencyKey,
        });


      res.status(200).json({

        success:
          true,

        message:
          result.duplicateRequest
            ? "Refund was already processed"
            : "Return and refund completed successfully",

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };