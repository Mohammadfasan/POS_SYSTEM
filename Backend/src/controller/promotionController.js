import { z } from "zod";

import {
  createPromotion,
  getPromotions,
  getPromotionById,
  changePromotionStatus,
} from "../services/promotionService.js";


const createSchema =
  z.object({

    code:
      z.string()
        .trim()
        .min(2)
        .max(50),

    name:
      z.string()
        .trim()
        .min(2)
        .max(150),

    description:
      z.string()
        .trim()
        .max(500)
        .optional(),

    discountType:
      z.enum([
        "PERCENTAGE",
        "FIXED_AMOUNT",
      ]),

    scope:
      z.enum([
        "CART",
        "PRODUCT",
        "CATEGORY",
      ]),

    value:
      z.coerce
        .number()
        .positive(),

    minPurchaseAmount:
      z.coerce
        .number()
        .nonnegative()
        .default(0),

    maxDiscountAmount:
      z.coerce
        .number()
        .positive()
        .optional(),

    autoApply:
      z.boolean()
        .default(true),

    priority:
      z.coerce
        .number()
        .int()
        .default(0),

    startAt:
      z.coerce.date(),

    endAt:
      z.coerce.date(),

    status:
      z.enum([
        "ACTIVE",
        "INACTIVE",
      ])
      .default("ACTIVE"),

    branchId:
      z.string()
        .uuid()
        .optional(),

    productId:
      z.string()
        .uuid()
        .optional(),

    categoryId:
      z.string()
        .uuid()
        .optional(),
  });


export const createPromotionController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const data =
        createSchema.parse(
          req.body
        );


      const promotion =
        await createPromotion({
          user:
            req.user,

          data,
        });


      res.status(201).json({

        success:
          true,

        message:
          "Promotion created successfully",

        data: {
          promotion,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const getPromotionsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const promotions =
        await getPromotions({

          user:
            req.user,

          status:
            req.query.status,

          scope:
            req.query.scope,
        });


      res.status(200).json({

        success:
          true,

        count:
          promotions.length,

        data: {
          promotions,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const getPromotionController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const promotionId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const promotion =
        await getPromotionById({
          user:
            req.user,

          promotionId,
        });


      res.status(200).json({
        success: true,

        data: {
          promotion,
        },
      });

    } catch (error) {
      next(error);
    }
  };


export const updatePromotionStatusController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const promotionId =
        z.string()
          .uuid()
          .parse(
            req.params.id
          );


      const data =
        z.object({
          status:
            z.enum([
              "ACTIVE",
              "INACTIVE",
            ]),
        })
        .parse(
          req.body
        );


      const promotion =
        await changePromotionStatus({

          user:
            req.user,

          promotionId,

          status:
            data.status,
        });


      res.status(200).json({

        success:
          true,

        message:
          "Promotion status updated",

        data: {
          promotion,
        },
      });

    } catch (error) {
      next(error);
    }
  };