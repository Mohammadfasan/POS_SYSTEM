import { z } from "zod";

import {
  createHeldBill,
  getHeldBills,
  getHeldBillById,
  getHeldBillByNumber,
  cancelHeldBill,
  resumeHeldBill,
} from "../services/heldBillService.js";


// ======================================================
// CREATE VALIDATION
// ======================================================

const createHeldBillSchema =
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
        "At least one item is required"
      )
      .max(
        100,
        "Maximum 100 items allowed"
      ),


    note:
      z.string()
        .trim()
        .max(500)
        .optional(),


    expiresInMinutes:
      z.coerce
        .number()
        .int()
        .min(5)
        .max(1440)
        .optional(),
  });


// ======================================================
// QUERY
// ======================================================

const heldBillQuerySchema =
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
        "HELD",
        "RESUMING",
        "RESUMED",
        "CANCELLED",
        "EXPIRED",
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

    search:
      z.string()
        .trim()
        .max(100)
        .optional(),
  });


// ======================================================
// CANCEL VALIDATION
// ======================================================

const cancelHeldBillSchema =
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
// CREATE
// ======================================================

export const createHeldBillController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        createHeldBillSchema.parse(
          req.body
        );


      const heldBill =
        await createHeldBill({

          user:
            req.user,

          items:
            data.items,

          note:
            data.note,

          expiresInMinutes:
            data.expiresInMinutes,
        });


      res.status(201).json({

        success:
          true,

        message:
          "Bill held successfully",

        data: {
          heldBill,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET ALL
// ======================================================

export const getHeldBillsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        heldBillQuerySchema.parse(
          req.query
        );


      const result =
        await getHeldBills({

          user:
            req.user,

          status:
            query.status,

          branchId:
            query.branchId,

          shiftId:
            query.shiftId,

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

export const getHeldBillController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const heldBillId =
        z.string()
          .uuid(
            "Invalid held bill ID"
          )
          .parse(
            req.params.id
          );


      const heldBill =
        await getHeldBillById({

          user:
            req.user,

          heldBillId,
        });


      res.status(200).json({

        success:
          true,

        data: {
          heldBill,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET BY HOLD NUMBER
// ======================================================

export const getHeldBillNumberController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const holdNumber =
        z.string()
          .trim()
          .min(3)
          .max(150)
          .parse(
            req.params.holdNumber
          );


      const heldBill =
        await getHeldBillByNumber({

          user:
            req.user,

          holdNumber,
        });


      res.status(200).json({

        success:
          true,

        data: {
          heldBill,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// CANCEL
// ======================================================

export const cancelHeldBillController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const heldBillId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        cancelHeldBillSchema.parse(
          req.body
        );


      const heldBill =
        await cancelHeldBill({

          user:
            req.user,

          heldBillId,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Held bill cancelled successfully",

        data: {
          heldBill,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// RESUME
// ======================================================

export const resumeHeldBillController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const heldBillId =
        z.string()
          .uuid(
            "Invalid held bill ID"
          )
          .parse(
            req.params.id
          );


      const result =
        await resumeHeldBill({

          user:
            req.user,

          heldBillId,
        });


      res.status(200).json({

        success:
          true,

        message:
          result.alreadyResumed
            ? "Held bill was already resumed"
            : "Held bill resumed and sale created successfully",

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };