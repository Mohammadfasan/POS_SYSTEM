import { z } from "zod";

import {
  createDiscountRequest,
  approveDiscountRequest,
  getDiscountRequests,
  rejectDiscountRequest,
} from "../services/discountService.js";


const requestSchema =
  z.object({

    saleId:
      z.string()
        .uuid(),

    discountType:
      z.enum([
        "PERCENTAGE",
        "FIXED_AMOUNT",
      ]),

    value:
      z.coerce
        .number()
        .positive(),

    reason:
      z.string()
        .trim()
        .min(3)
        .max(500),
  });


export const createDiscountController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        requestSchema.parse(
          req.body
        );


      const discount =
        await createDiscountRequest({

          user:
            req.user,

          ...data,
        });


      res.status(201).json({

        success:
          true,

        message:
          "Discount request sent for approval",

        data: {
          discount,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const approveDiscountController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const discount =
        await approveDiscountRequest({

          user:
            req.user,

          discountId:
            req.params.id,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Discount approved and applied successfully",

        data: {
          discount,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const getDiscountsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const discounts =
        await getDiscountRequests({

          user:
            req.user,

          status:
            req.query.status,
        });


      res.status(200).json({

        success:
          true,

        count:
          discounts.length,

        data: {
          discounts,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const rejectDiscountController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        z.object({
          reason:
            z.string()
              .trim()
              .min(2)
              .max(500),
        })
        .parse(
          req.body
        );


      const discount =
        await rejectDiscountRequest({

          user:
            req.user,

          discountId:
            req.params.id,

          reason:
            data.reason,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Discount request rejected",

        data: {
          discount,
        },
      });

    } catch (error) {
      next(error);
    }
  };