import { z } from "zod";

import {
  processPayment,
  getSalePayments,
  getPaymentById,
} from "../services/paymentService.js";


const paymentSchema =
  z.object({
    saleId:
      z.string().uuid(),

    method:
      z.enum([
        "CASH",
        "CARD",
        "QR",
      ]),

    amount:
      z.coerce
        .number()
        .positive(),

    tenderedAmount:
      z.coerce
        .number()
        .nonnegative()
        .optional(),

    transactionReference:
      z.string()
        .max(150)
        .optional(),

    note:
      z.string()
        .max(500)
        .optional(),
  });


// ========================================
// PROCESS PAYMENT
// ========================================

export const processPaymentController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const validatedData =
        paymentSchema.parse(
          req.body
        );


      const idempotencyKey =
        req.get(
          "Idempotency-Key"
        );


      const result =
        await processPayment({
          user:
            req.user,

          idempotencyKey,

          ...validatedData,
        });


      res.status(200).json({
        success:
          true,

        message:
          result.fullyPaid
            ? "Payment completed and sale finalized successfully"
            : "Partial payment recorded successfully",

        data:
          result,
      });

    } catch (error) {
      next(error);
    }
  };


// ========================================
// SALE PAYMENTS
// ========================================

export const getSalePaymentsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const payments =
        await getSalePayments({
          user:
            req.user,

          saleId:
            req.params.saleId,
        });


      res.status(200).json({
        success:
          true,

        count:
          payments.length,

        data: {
          payments,
        },
      });

    } catch (error) {
      next(error);
    }
  };


// ========================================
// GET ONE
// ========================================

export const getPaymentController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const payment =
        await getPaymentById({
          user:
            req.user,

          paymentId:
            req.params.id,
        });


      res.status(200).json({
        success:
          true,

        data: {
          payment,
        },
      });

    } catch (error) {
      next(error);
    }
  };