import crypto from "crypto";

import {
  Prisma,
} from "@prisma/client";

import prisma from "../config/prisma.js";

import {
  finalizeSaleAfterPayment,
} from "./saleService.js";


const money = (value) => {
  return new Prisma.Decimal(
    value
  ).toDecimalPlaces(2);
};


// ==========================================
// SERIALIZABLE TRANSACTION WITH RETRY
// ==========================================

const runSerializableTransaction =
  async (
    callback,
    maxRetries = 3
  ) => {

    let attempts = 0;

    while (
      attempts < maxRetries
    ) {

      try {

        return await prisma.$transaction(
          callback,
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,
          }
        );

      } catch (error) {

        attempts++;

        if (
          error.code === "P2034" &&
          attempts < maxRetries
        ) {
          continue;
        }

        throw error;
      }
    }
  };


// ==========================================
// GENERATE PAYMENT NUMBER
// ==========================================

const generatePaymentNumber =
  () => {

    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const random =
      crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase();

    return `PAY-${date}-${random}`;
  };


// ==========================================
// GENERATE INVOICE NUMBER
// ==========================================

const generateInvoiceNumber =
  (branchCode) => {

    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const random =
      crypto
        .randomUUID()
        .slice(0, 8)
        .toUpperCase();

    return `INV-${branchCode}-${date}-${random}`;
  };


// ==========================================
// EXPECTED CASH
// ==========================================

const calculateExpectedCash =
  (shift) => {

    return shift.openingCash
      .plus(
        shift.cashSales
      )
      .plus(
        shift.cashIn
      )
      .minus(
        shift.cashRefunds
      )
      .minus(
        shift.cashOut
      );
  };


// ==========================================
// CHECK PAYMENT ACCESS
// ==========================================

const validatePaymentAccess =
  (
    user,
    payment
  ) => {

    if (
      user.role === "ADMIN"
    ) {
      return;
    }

    if (
      user.role === "MANAGER"
    ) {

      if (
        !user.branchId ||
        payment.sale.branchId !==
          user.branchId
      ) {

        const error =
          new Error(
            "You cannot access payments from another branch"
          );

        error.statusCode = 403;
        throw error;
      }

      return;
    }

    if (
      user.role === "CASHIER" &&
      payment.cashierId !==
        user.id
    ) {

      const error =
        new Error(
          "You cannot access another cashier's payment"
        );

      error.statusCode = 403;
      throw error;
    }
  };


// ==========================================
// PROCESS PAYMENT
// ==========================================

export const processPayment =
  async ({
    user,
    saleId,
    method,
    amount,
    tenderedAmount,
    transactionReference,
    note,
    idempotencyKey,
  }) => {

    if (
      user.role !== "CASHIER"
    ) {

      const error =
        new Error(
          "Only cashier can process POS payments"
        );

      error.statusCode = 403;
      throw error;
    }


    if (!idempotencyKey) {

      const error =
        new Error(
          "Idempotency-Key header is required"
        );

      error.statusCode = 400;
      throw error;
    }


    // ==========================================
    // DUPLICATE REQUEST PROTECTION
    // ==========================================

    const previousPayment =
      await prisma.payment.findUnique({
        where: {
          idempotencyKey,
        },

        include: {
          sale: true,
        },
      });


    if (previousPayment) {

      return {
        payment:
          previousPayment,

        sale:
          previousPayment.sale,

        duplicateRequest:
          true,
      };
    }


    const paymentAmount =
      money(amount);


    if (
      paymentAmount.lte(0)
    ) {

      const error =
        new Error(
          "Payment amount must be greater than zero"
        );

      error.statusCode = 400;
      throw error;
    }


    return runSerializableTransaction(
      async (tx) => {

        // ========================================
        // SALE
        // ========================================

        const sale =
          await tx.sale.findUnique({
            where: {
              id: saleId,
            },

            include: {
              branch: true,

              shift: true,

              terminal: {
                include: {
                  cashDrawer: true,
                },
              },
            },
          });


        if (!sale) {

          const error =
            new Error(
              "Sale not found"
            );

          error.statusCode = 404;
          throw error;
        }


        if (
          sale.cashierId !==
          user.id
        ) {

          const error =
            new Error(
              "You cannot process payment for another cashier's sale"
            );

          error.statusCode = 403;
          throw error;
        }


        if (
          ![
            "PENDING_PAYMENT",
            "PARTIALLY_PAID",
          ].includes(
            sale.status
          )
        ) {

          const error =
            new Error(
              "Sale is not waiting for payment"
            );

          error.statusCode = 400;
          throw error;
        }


        if (
          sale.expiresAt &&
          sale.expiresAt <
            new Date()
        ) {

          const error =
            new Error(
              "Sale payment session has expired"
            );

          error.statusCode = 400;
          throw error;
        }


        if (
          sale.shift.status !==
          "OPEN"
        ) {

          const error =
            new Error(
              "Cashier shift is closed"
            );

          error.statusCode = 400;
          throw error;
        }


        // ========================================
        // COMPLETED PAYMENTS SO FAR
        // ========================================

        const paymentSummary =
          await tx.payment.aggregate({
            where: {
              saleId:
                sale.id,

              status:
                "COMPLETED",
            },

            _sum: {
              amount:
                true,
            },
          });


        const paidSoFar =
          paymentSummary
            ._sum
            .amount ??
          new Prisma.Decimal(0);


        const remainingAmount =
          sale.grandTotal.minus(
            paidSoFar
          );


        if (
          remainingAmount.lte(0)
        ) {

          const error =
            new Error(
              "Sale is already fully paid"
            );

          error.statusCode = 409;
          throw error;
        }


        if (
          paymentAmount.gt(
            remainingAmount
          )
        ) {

          const error =
            new Error(
              `Payment exceeds remaining amount. Remaining: ${remainingAmount.toString()}`
            );

          error.statusCode = 400;
          throw error;
        }


        // ========================================
        // CASH VALIDATION
        // ========================================

        let cashTendered = null;
        let changeAmount = null;
        let drawer = null;


        if (
          method === "CASH"
        ) {

          if (
            !sale.terminal
              .cashDrawer
          ) {

            const error =
              new Error(
                "No cash drawer configured for this terminal"
              );

            error.statusCode = 400;
            throw error;
          }


          drawer =
            sale.terminal
              .cashDrawer;


          if (
            drawer.status !==
            "ACTIVE"
          ) {

            const error =
              new Error(
                "Cash drawer is not active"
              );

            error.statusCode = 400;
            throw error;
          }


          if (
            tenderedAmount ===
            undefined ||
            tenderedAmount ===
            null
          ) {

            const error =
              new Error(
                "Tendered amount is required for cash payment"
              );

            error.statusCode = 400;
            throw error;
          }


          cashTendered =
            money(
              tenderedAmount
            );


          if (
            cashTendered.lt(
              paymentAmount
            )
          ) {

            const error =
              new Error(
                "Tendered amount is less than payment amount"
              );

            error.statusCode = 400;
            throw error;
          }


          changeAmount =
            money(
              cashTendered.minus(
                paymentAmount
              )
            );
        }


        // ========================================
        // CARD / QR REFERENCE
        // ========================================

        if (
          ["CARD", "QR"].includes(
            method
          ) &&
          !transactionReference
        ) {

          const error =
            new Error(
              "Transaction reference is required for CARD or QR payment"
            );

          error.statusCode = 400;
          throw error;
        }


        // ========================================
        // CREATE PAYMENT
        // ========================================

        const payment =
          await tx.payment.create({
            data: {
              paymentNumber:
                generatePaymentNumber(),

              idempotencyKey,

              method,

              status:
                "COMPLETED",

              amount:
                paymentAmount,

              tenderedAmount:
                cashTendered,

              changeAmount,

              transactionReference:
                transactionReference
                  ?.trim() ||
                null,

              note:
                note?.trim() ||
                null,

              saleId:
                sale.id,

              shiftId:
                sale.shiftId,

              cashierId:
                user.id,

              drawerId:
                drawer?.id ||
                null,
            },
          });


        // ========================================
        // CASH PAYMENT → UPDATE SHIFT/DRAWER
        // ========================================

        if (
          method === "CASH"
        ) {

          const currentShift =
            await tx.cashierShift.findUnique({
              where: {
                id:
                  sale.shiftId,
              },
            });


          const balanceBefore =
            calculateExpectedCash(
              currentShift
            );


          const balanceAfter =
            balanceBefore.plus(
              paymentAmount
            );


          await tx.cashierShift.update({
            where: {
              id:
                sale.shiftId,
            },

            data: {
              cashSales: {
                increment:
                  paymentAmount,
              },

              expectedCash:
                balanceAfter,
            },
          });


          await tx.cashDrawerTransaction.create({
            data: {
              type:
                "SALE",

              amount:
                paymentAmount,

              balanceBefore,

              balanceAfter,

              reason:
                `Cash payment for ${sale.saleNumber}`,

              referenceType:
                "PAYMENT",

              referenceId:
                payment.id,

              drawerId:
                drawer.id,

              shiftId:
                sale.shiftId,

              createdById:
                user.id,
            },
          });
        }


        // ========================================
        // CALCULATE TOTAL AFTER THIS PAYMENT
        // ========================================

        const totalPaid =
          paidSoFar.plus(
            paymentAmount
          );


        const newRemaining =
          money(
            sale.grandTotal.minus(
              totalPaid
            )
          );


        let updatedSale;


        // ========================================
        // FULL PAYMENT
        // ========================================

        if (
          newRemaining.lte(0)
        ) {

          updatedSale =
            await finalizeSaleAfterPayment({
              tx,

              saleId:
                sale.id,

              invoiceNumber:
                generateInvoiceNumber(
                  sale.branch.code
                ),
            });

        } else {

          // ======================================
          // PARTIAL PAYMENT
          // ======================================

          updatedSale =
            await tx.sale.update({
              where: {
                id:
                  sale.id,
              },

              data: {
                status:
                  "PARTIALLY_PAID",
              },

              include: {
                items:
                  true,
              },
            });
        }


        return {
          payment,

          sale:
            updatedSale,

          totalPaid:
            money(totalPaid),

          remainingAmount:
            newRemaining,

          fullyPaid:
            newRemaining.lte(0),

          duplicateRequest:
            false,
        };
      }
    );
  };


// ==========================================
// GET PAYMENTS FOR SALE
// ==========================================

export const getSalePayments =
  async ({
    user,
    saleId,
  }) => {

    const sale =
      await prisma.sale.findUnique({
        where: {
          id:
            saleId,
        },
      });


    if (!sale) {

      const error =
        new Error(
          "Sale not found"
        );

      error.statusCode = 404;
      throw error;
    }


    if (
      user.role === "CASHIER" &&
      sale.cashierId !==
        user.id
    ) {

      const error =
        new Error(
          "You cannot access another cashier's payments"
        );

      error.statusCode = 403;
      throw error;
    }


    if (
      user.role === "MANAGER" &&
      sale.branchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot access another branch's payments"
        );

      error.statusCode = 403;
      throw error;
    }


    return prisma.payment.findMany({
      where: {
        saleId,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });
  };


// ==========================================
// GET ONE PAYMENT
// ==========================================

export const getPaymentById =
  async ({
    user,
    paymentId,
  }) => {

    const payment =
      await prisma.payment.findUnique({
        where: {
          id:
            paymentId,
        },

        include: {
          sale:
            true,

          shift: {
            select: {
              id: true,
              shiftNumber: true,
            },
          },

          drawer: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });


    if (!payment) {

      const error =
        new Error(
          "Payment not found"
        );

      error.statusCode = 404;
      throw error;
    }


    validatePaymentAccess(
      user,
      payment
    );


    return payment;
  };