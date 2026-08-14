import { z } from "zod";

import {
  createVoidRequest,
  getVoidRequests,
  getVoidRequestById,
  getVoidRequestByNumber,
  approveVoidRequest,
  rejectVoidRequest,
  cancelVoidRequest,
  executeVoidRequest,
} from "../services/voidService.js";


// ======================================================
// CREATE
// ======================================================

const createVoidSchema =
  z.object({

    saleId:
      z.string()
        .uuid(
          "Invalid sale ID"
        ),

    reason:
      z.string()
        .trim()
        .min(
          3,
          "Void reason is required"
        )
        .max(500),
  });


// ======================================================
// QUERY
// ======================================================

const voidQuerySchema =
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
// REASON
// ======================================================

const reasonSchema =
  z.object({

    reason:
      z.string()
        .trim()
        .min(2)
        .max(500),
  });


// ======================================================
// EXECUTE
// ======================================================

const executeVoidSchema =
  z.object({

    refundReferences:
      z.array(

        z.object({

          paymentId:
            z.string()
              .uuid(),

          transactionReference:
            z.string()
              .trim()
              .min(1)
              .max(150),
        })
      )
      .max(20)
      .default([]),
  });


// ======================================================
// CREATE
// ======================================================

export const createVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        createVoidSchema.parse(
          req.body
        );


      const voidRequest =
        await createVoidRequest({

          user:
            req.user,

          saleId:
            data.saleId,

          reason:
            data.reason,
        });


      res.status(201).json({

        success:
          true,

        message:
          "Void request created successfully and is waiting for approval",

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// LIST
// ======================================================

export const getVoidRequestsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        voidQuerySchema.parse(
          req.query
        );


      const result =
        await getVoidRequests({

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

export const getVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const voidRequest =
        await getVoidRequestById({

          user:
            req.user,

          voidId,
        });


      res.status(200).json({

        success:
          true,

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET BY NUMBER
// ======================================================

export const getVoidNumberController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidNumber =
        z.string()
          .trim()
          .min(3)
          .max(150)
          .parse(
            req.params.voidNumber
          );


      const voidRequest =
        await getVoidRequestByNumber({

          user:
            req.user,

          voidNumber,
        });


      res.status(200).json({

        success:
          true,

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// APPROVE
// ======================================================

export const approveVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const voidRequest =
        await approveVoidRequest({

          user:
            req.user,

          voidId,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Void request approved successfully",

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// REJECT
// ======================================================

export const rejectVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        reasonSchema.parse(
          req.body
        );


      const voidRequest =
        await rejectVoidRequest({

          user:
            req.user,

          voidId,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Void request rejected successfully",

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// CANCEL
// ======================================================

export const cancelVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        reasonSchema.parse(
          req.body
        );


      const voidRequest =
        await cancelVoidRequest({

          user:
            req.user,

          voidId,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Void request cancelled successfully",

        data: {
          voidRequest,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// EXECUTE
// ======================================================

export const executeVoidController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const voidId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        executeVoidSchema.parse(
          req.body
        );


      const idempotencyKey =
        req.get(
          "Idempotency-Key"
        );


      const result =
        await executeVoidRequest({

          user:
            req.user,

          voidId,

          refundReferences:
            data.refundReferences,

          idempotencyKey,
        });


      res.status(200).json({

        success:
          true,

        message:
          result.duplicateRequest
            ? "Void was already processed"
            : "Sale voided successfully",

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };