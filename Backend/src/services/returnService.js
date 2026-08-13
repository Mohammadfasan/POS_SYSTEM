import crypto from "crypto";
import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";


// ======================================================
// DECIMAL HELPERS
// ======================================================

const money = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(2);
};


const quantityDecimal = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(3);
};


const zero = () => {
  return new Prisma.Decimal(0);
};


// ======================================================
// SERIALIZABLE TRANSACTION + RETRY
// ======================================================

const runSerializableTransaction = async (
  callback,
  maxRetries = 3
) => {

  let attempt = 0;

  while (attempt < maxRetries) {

    try {

      return await prisma.$transaction(
        callback,
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );

    } catch (error) {

      attempt++;

      if (
        error.code === "P2034" &&
        attempt < maxRetries
      ) {
        continue;
      }

      throw error;
    }
  }
};


// ======================================================
// NUMBER GENERATORS
// ======================================================

const generateReturnNumber = (
  branchCode
) => {

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase();

  return `RET-${branchCode}-${date}-${random}`;
};


const generateRefundNumber = () => {

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase();

  return `REF-${date}-${random}`;
};


// ======================================================
// EXPECTED CASH
// ======================================================

const calculateExpectedCash = (
  shift
) => {

  return shift.openingCash
    .plus(shift.cashSales)
    .plus(shift.cashIn)
    .minus(shift.cashRefunds)
    .minus(shift.cashOut);
};


// ======================================================
// RETURN STATUSES THAT RESERVE RETURN QUANTITY
// ======================================================

const activeReturnStatuses = [
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
];


// ======================================================
// RETURN INCLUDE
// ======================================================

const returnInclude = {

  branch: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },


  sale: {
    select: {

      id: true,
      saleNumber: true,
      invoiceNumber: true,
      status: true,

      branchId: true,

      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      grandTotal: true,

      completedAt: true,

      payments: {

        where: {
          status: "COMPLETED",
        },

        orderBy: {
          createdAt: "asc",
        },

        select: {
          id: true,
          paymentNumber: true,
          method: true,
          amount: true,
          transactionReference: true,
          createdAt: true,

          refunds: {

            where: {
              status: "COMPLETED",
            },

            select: {
              amount: true,
            },
          },
        },
      },
    },
  },


  requestedBy: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },


  approvedBy: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },


  rejectedBy: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },


  cancelledBy: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },


  completedBy: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
  },


  items: {

    orderBy: {
      createdAt: "asc",
    },
  },


  refunds: {

    orderBy: {
      createdAt: "asc",
    },

    include: {

      payment: {
        select: {
          id: true,
          paymentNumber: true,
          method: true,
          amount: true,
        },
      },

      processedBy: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
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
  },
};


// ======================================================
// ADD REFUND SUMMARY
// ======================================================

const addReturnSummary = (
  saleReturn
) => {

  const payments =
    saleReturn.sale?.payments?.map(
      (payment) => {

        const refundedAmount =
          payment.refunds.reduce(
            (total, refund) =>
              total.plus(refund.amount),

            zero()
          );


        let refundableAmount =
          payment.amount.minus(
            refundedAmount
          );


        if (
          refundableAmount.lt(0)
        ) {
          refundableAmount = zero();
        }


        const {
          refunds,
          ...paymentData
        } = payment;


        return {

          ...paymentData,

          refundedAmount:
            money(refundedAmount),

          refundableAmount:
            money(refundableAmount),
        };
      }
    ) || [];


  const completedRefundAmount =
    saleReturn.refunds
      ?.filter(
        (refund) =>
          refund.status ===
          "COMPLETED"
      )
      .reduce(
        (total, refund) =>
          total.plus(refund.amount),

        zero()
      ) || zero();


  return {

    ...saleReturn,

    sale: saleReturn.sale
      ? {
          ...saleReturn.sale,
          payments,
        }
      : null,

    refundSummary: {

      requiredRefundAmount:
        money(
          saleReturn.refundTotal
        ),

      processedRefundAmount:
        money(
          completedRefundAmount
        ),

      fullyRefunded:
        completedRefundAmount.gte(
          saleReturn.refundTotal
        ),
    },
  };
};


// ======================================================
// ACCESS CONTROL
// ======================================================

const validateReturnAccess = (
  user,
  saleReturn
) => {

  // ADMIN
  if (
    user.role === "ADMIN"
  ) {
    return;
  }


  // MANAGER / CASHIER:
  // Own branch only
  if (
    ["MANAGER", "CASHIER"].includes(
      user.role
    )
  ) {

    if (!user.branchId) {

      const error =
        new Error(
          "User is not assigned to a branch"
        );

      error.statusCode = 403;

      throw error;
    }


    if (
      saleReturn.branchId !==
      user.branchId
    ) {

      const error =
        new Error(
          "You cannot access returns from another branch"
        );

      error.statusCode = 403;

      throw error;
    }
  }
};


// ======================================================
// MANAGER APPROVAL ACCESS
// ======================================================

const validateApprovalAccess = (
  user,
  saleReturn
) => {

  if (
    user.role === "ADMIN"
  ) {
    return;
  }


  if (
    user.role !== "MANAGER"
  ) {

    const error =
      new Error(
        "Only manager or admin can approve or reject returns"
      );

    error.statusCode = 403;

    throw error;
  }


  if (
    !user.branchId ||
    user.branchId !==
      saleReturn.branchId
  ) {

    const error =
      new Error(
        "You cannot manage another branch's return"
      );

    error.statusCode = 403;

    throw error;
  }
};


// ======================================================
// CREATE RETURN REQUEST
// ======================================================

export const createReturnRequest =
  async ({
    user,
    saleId,
    items,
    note,
  }) => {

    if (
      user.role !== "CASHIER"
    ) {

      const error =
        new Error(
          "Only cashier can create a return request"
        );

      error.statusCode = 403;

      throw error;
    }


    if (!user.branchId) {

      const error =
        new Error(
          "Cashier is not assigned to a branch"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      const error =
        new Error(
          "Return must contain at least one item"
        );

      error.statusCode = 400;

      throw error;
    }


    return runSerializableTransaction(
      async (tx) => {

        // ============================================
        // ORIGINAL SALE
        // ============================================

        const sale =
          await tx.sale.findUnique({

            where: {
              id: saleId,
            },

            include: {

              branch: true,

              items: true,
            },
          });


        if (!sale) {

          const error =
            new Error(
              "Original sale not found"
            );

          error.statusCode = 404;

          throw error;
        }


        // ============================================
        // SALE STATUS
        // ============================================

        if (
          ![
            "COMPLETED",
            "PARTIALLY_REFUNDED",
          ].includes(
            sale.status
          )
        ) {

          const error =
            new Error(
              "Only completed sales can be returned"
            );

          error.statusCode = 400;

          throw error;
        }


        // ============================================
        // BRANCH
        // ============================================

        if (
          sale.branchId !==
          user.branchId
        ) {

          const error =
            new Error(
              "You cannot return a sale from another branch"
            );

          error.statusCode = 403;

          throw error;
        }


        if (
          sale.branch.status !==
          "ACTIVE"
        ) {

          const error =
            new Error(
              "Branch is not active"
            );

          error.statusCode = 400;

          throw error;
        }


        // ============================================
        // DUPLICATE SALE ITEMS
        // ============================================

        const requestedItemIds =
          new Set();


        for (
          const item of items
        ) {

          if (
            requestedItemIds.has(
              item.saleItemId
            )
          ) {

            const error =
              new Error(
                "Duplicate sale items are not allowed"
              );

            error.statusCode = 400;

            throw error;
          }


          requestedItemIds.add(
            item.saleItemId
          );
        }


        let refundTotal =
          zero();


        const preparedItems =
          [];


        // ============================================
        // PROCESS RETURN ITEMS
        // ============================================

        for (
          const requestItem of
            items
        ) {

          const returnQuantity =
            quantityDecimal(
              requestItem.quantity
            );


          if (
            returnQuantity.lte(0)
          ) {

            const error =
              new Error(
                "Return quantity must be greater than zero"
              );

            error.statusCode = 400;

            throw error;
          }


          // ==========================================
          // SALE ITEM
          // ==========================================

          const saleItem =
            sale.items.find(
              (item) =>
                item.id ===
                requestItem.saleItemId
            );


          if (!saleItem) {

            const error =
              new Error(
                "Sale item does not belong to this sale"
              );

            error.statusCode = 400;

            throw error;
          }


          // ==========================================
          // PREVIOUS RETURNS
          //
          // PENDING + APPROVED + PROCESSING +
          // COMPLETED all count.
          //
          // REJECTED/CANCELLED do not count.
          // ==========================================

          const previous =
            await tx.returnItem.aggregate({

              where: {

                saleItemId:
                  saleItem.id,

                saleReturn: {

                  status: {
                    in:
                      activeReturnStatuses,
                  },
                },
              },

              _sum: {

                quantity:
                  true,

                baseQuantity:
                  true,

                refundSubtotal:
                  true,

                refundDiscount:
                  true,

                refundTax:
                  true,

                refundTotal:
                  true,
              },
            });


          const previousQuantity =
            previous._sum.quantity ??
            zero();


          const previousBaseQuantity =
            previous._sum.baseQuantity ??
            zero();


          const previousSubtotal =
            previous._sum.refundSubtotal ??
            zero();


          const previousDiscount =
            previous._sum.refundDiscount ??
            zero();


          const previousTax =
            previous._sum.refundTax ??
            zero();


          const previousTotal =
            previous._sum.refundTotal ??
            zero();


          // ==========================================
          // REMAINING RETURNABLE QUANTITY
          // ==========================================

          const remainingQuantity =
            saleItem.quantity.minus(
              previousQuantity
            );


          if (
            remainingQuantity.lte(0)
          ) {

            const error =
              new Error(
                `${saleItem.productName} has already been fully returned or is part of another active return`
              );

            error.statusCode = 400;

            throw error;
          }


          if (
            returnQuantity.gt(
              remainingQuantity
            )
          ) {

            const error =
              new Error(
                `Cannot return ${returnQuantity.toString()} ${saleItem.selectedUnitSymbol} of ${saleItem.productName}. Remaining returnable quantity: ${remainingQuantity.toString()} ${saleItem.selectedUnitSymbol}`
              );

            error.statusCode = 400;

            throw error;
          }


          let baseQuantity;

          let refundSubtotal;
          let refundDiscount;
          let refundTax;
          let itemRefundTotal;


          // ==========================================
          // IF RETURNING ALL REMAINING QUANTITY
          //
          // Use exact remaining values to prevent
          // rounding errors.
          // ==========================================

          if (
            returnQuantity.eq(
              remainingQuantity
            )
          ) {

            baseQuantity =
              quantityDecimal(
                saleItem
                  .baseQuantity
                  .minus(
                    previousBaseQuantity
                  )
              );


            refundSubtotal =
              money(
                saleItem
                  .lineSubtotal
                  .minus(
                    previousSubtotal
                  )
              );


            refundDiscount =
              money(
                saleItem
                  .discountAmount
                  .minus(
                    previousDiscount
                  )
              );


            refundTax =
              money(
                saleItem
                  .taxAmount
                  .minus(
                    previousTax
                  )
              );


            itemRefundTotal =
              money(
                saleItem
                  .lineTotal
                  .minus(
                    previousTotal
                  )
              );

          } else {

            // ========================================
            // PARTIAL RETURN
            // ========================================

            const ratio =
              returnQuantity.div(
                saleItem.quantity
              );


            baseQuantity =
              quantityDecimal(
                saleItem
                  .baseQuantity
                  .mul(ratio)
              );


            refundSubtotal =
              money(
                saleItem
                  .lineSubtotal
                  .mul(ratio)
              );


            refundDiscount =
              money(
                saleItem
                  .discountAmount
                  .mul(ratio)
              );


            refundTax =
              money(
                saleItem
                  .taxAmount
                  .mul(ratio)
              );


            itemRefundTotal =
              money(
                saleItem
                  .lineTotal
                  .mul(ratio)
              );
          }


          if (
            baseQuantity.lt(0) ||
            itemRefundTotal.lt(0)
          ) {

            const error =
              new Error(
                `Invalid return calculation for ${saleItem.productName}`
              );

            error.statusCode = 409;

            throw error;
          }


          refundTotal =
            refundTotal.plus(
              itemRefundTotal
            );


          // ==========================================
          // SNAPSHOT
          // ==========================================

          preparedItems.push({

            saleItemId:
              saleItem.id,

            productId:
              saleItem.productId,

            productName:
              saleItem.productName,

            sku:
              saleItem.sku,

            barcode:
              saleItem.barcode,

            quantity:
              returnQuantity,

            baseQuantity,

            unitId:
              saleItem.selectedUnitId,

            unitCode:
              saleItem.selectedUnitCode,

            unitSymbol:
              saleItem.selectedUnitSymbol,

            unitFactor:
              saleItem.selectedUnitFactor,

            reason:
              requestItem.reason
                ?.trim() ||
              null,

            restock:
              requestItem.restock !==
              false,

            trackInventory:
              saleItem.trackInventory,

            refundSubtotal,

            refundDiscount,

            refundTax,

            refundTotal:
              itemRefundTotal,
          });
        }


        refundTotal =
          money(refundTotal);


        // ============================================
        // CREATE RETURN
        // ============================================

        const saleReturn =
          await tx.saleReturn.create({

            data: {

              returnNumber:
                generateReturnNumber(
                  sale.branch.code
                ),

              status:
                "PENDING",

              saleId:
                sale.id,

              branchId:
                sale.branchId,

              requestedById:
                user.id,

              note:
                note?.trim() ||
                null,

              refundTotal,

              items: {
                create:
                  preparedItems,
              },
            },

            include:
              returnInclude,
          });


        return addReturnSummary(
          saleReturn
        );
      }
    );
  };


// ======================================================
// GET RETURNS
// ======================================================

export const getReturns =
  async ({
    user,
    status,
    branchId,
    saleId,
    search,
    page = 1,
    limit = 20,
  }) => {

    const skip =
      (page - 1) *
      limit;


    const where = {};


    // ==========================================
    // MANAGER / CASHIER
    // ==========================================

    if (
      ["MANAGER", "CASHIER"].includes(
        user.role
      )
    ) {

      if (!user.branchId) {

        const error =
          new Error(
            "User is not assigned to a branch"
          );

        error.statusCode = 403;

        throw error;
      }


      if (
        branchId &&
        branchId !==
          user.branchId
      ) {

        const error =
          new Error(
            "You cannot access another branch"
          );

        error.statusCode = 403;

        throw error;
      }


      where.branchId =
        user.branchId;
    }


    // ==========================================
    // ADMIN
    // ==========================================

    if (
      user.role === "ADMIN" &&
      branchId
    ) {

      where.branchId =
        branchId;
    }


    if (status) {

      where.status =
        status;
    }


    if (saleId) {

      where.saleId =
        saleId;
    }


    if (search) {

      where.OR = [

        {
          returnNumber: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          sale: {

            saleNumber: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },
        },

        {
          sale: {

            invoiceNumber: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },
        },
      ];
    }


    const [
      returns,
      total,
    ] =
      await prisma.$transaction([

        prisma.saleReturn.findMany({

          where,

          skip,

          take:
            limit,

          include: {

            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },

            sale: {
              select: {
                id: true,
                saleNumber: true,
                invoiceNumber: true,
                status: true,
                grandTotal: true,
              },
            },

            requestedBy: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
              },
            },

            approvedBy: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
              },
            },

            _count: {
              select: {
                items:
                  true,

                refunds:
                  true,
              },
            },
          },

          orderBy: {
            requestedAt:
              "desc",
          },
        }),


        prisma.saleReturn.count({
          where,
        }),
      ]);


    return {

      returns,

      pagination: {

        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    };
  };


// ======================================================
// GET ONE RETURN
// ======================================================

export const getReturnById =
  async ({
    user,
    returnId,
  }) => {

    const saleReturn =
      await prisma.saleReturn.findUnique({

        where: {
          id:
            returnId,
        },

        include:
          returnInclude,
      });


    if (!saleReturn) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateReturnAccess(
      user,
      saleReturn
    );


    return addReturnSummary(
      saleReturn
    );
  };


// ======================================================
// GET BY RETURN NUMBER
// ======================================================

export const getReturnByNumber =
  async ({
    user,
    returnNumber,
  }) => {

    const saleReturn =
      await prisma.saleReturn.findUnique({

        where: {
          returnNumber,
        },

        include:
          returnInclude,
      });


    if (!saleReturn) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateReturnAccess(
      user,
      saleReturn
    );


    return addReturnSummary(
      saleReturn
    );
  };


// ======================================================
// APPROVE RETURN
// ======================================================

export const approveReturn =
  async ({
    user,
    returnId,
  }) => {

    const saleReturn =
      await prisma.saleReturn.findUnique({

        where: {
          id:
            returnId,
        },

        include: {
          sale: true,
        },
      });


    if (!saleReturn) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateApprovalAccess(
      user,
      saleReturn
    );


    if (
      saleReturn.status !==
      "PENDING"
    ) {

      const error =
        new Error(
          "Only pending returns can be approved"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      ![
        "COMPLETED",
        "PARTIALLY_REFUNDED",
      ].includes(
        saleReturn.sale.status
      )
    ) {

      const error =
        new Error(
          "Original sale is no longer eligible for return"
        );

      error.statusCode = 400;

      throw error;
    }


    const result =
      await prisma.saleReturn.updateMany({

        where: {

          id:
            returnId,

          status:
            "PENDING",
        },

        data: {

          status:
            "APPROVED",

          approvedById:
            user.id,

          approvedAt:
            new Date(),
        },
      });


    if (
      result.count !== 1
    ) {

      const error =
        new Error(
          "Return status changed while approving"
        );

      error.statusCode = 409;

      throw error;
    }


    return getReturnById({
      user,

      returnId,
    });
  };


// ======================================================
// REJECT RETURN
// ======================================================

export const rejectReturn =
  async ({
    user,
    returnId,
    reason,
  }) => {

    const saleReturn =
      await prisma.saleReturn.findUnique({

        where: {
          id:
            returnId,
        },
      });


    if (!saleReturn) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateApprovalAccess(
      user,
      saleReturn
    );


    if (
      saleReturn.status !==
      "PENDING"
    ) {

      const error =
        new Error(
          "Only pending returns can be rejected"
        );

      error.statusCode = 400;

      throw error;
    }


    const result =
      await prisma.saleReturn.updateMany({

        where: {

          id:
            returnId,

          status:
            "PENDING",
        },

        data: {

          status:
            "REJECTED",

          rejectedById:
            user.id,

          rejectedAt:
            new Date(),

          rejectionReason:
            reason.trim(),
        },
      });


    if (
      result.count !== 1
    ) {

      const error =
        new Error(
          "Return status changed while rejecting"
        );

      error.statusCode = 409;

      throw error;
    }


    return getReturnById({
      user,
      returnId,
    });
  };


// ======================================================
// CANCEL RETURN
// ======================================================

export const cancelReturn =
  async ({
    user,
    returnId,
    reason,
  }) => {

    const saleReturn =
      await prisma.saleReturn.findUnique({

        where: {
          id:
            returnId,
        },
      });


    if (!saleReturn) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateReturnAccess(
      user,
      saleReturn
    );


    if (
      saleReturn.status !==
      "PENDING"
    ) {

      const error =
        new Error(
          "Only pending returns can be cancelled"
        );

      error.statusCode = 400;

      throw error;
    }


    const result =
      await prisma.saleReturn.updateMany({

        where: {

          id:
            returnId,

          status:
            "PENDING",
        },

        data: {

          status:
            "CANCELLED",

          cancelledById:
            user.id,

          cancelledAt:
            new Date(),

          cancelReason:
            reason.trim(),
        },
      });


    if (
      result.count !== 1
    ) {

      const error =
        new Error(
          "Return status changed while cancelling"
        );

      error.statusCode = 409;

      throw error;
    }


    return getReturnById({
      user,
      returnId,
    });
  };


// ======================================================
// PROCESS REFUND
// ======================================================

export const processReturnRefund =
  async ({
    user,
    returnId,
    refunds,
    idempotencyKey,
  }) => {

    // ============================================
    // CASHIER ONLY
    // ============================================

    if (
      user.role !== "CASHIER"
    ) {

      const error =
        new Error(
          "Only cashier can process the refund"
        );

      error.statusCode = 403;

      throw error;
    }


    if (!user.branchId) {

      const error =
        new Error(
          "Cashier is not assigned to a branch"
        );

      error.statusCode = 400;

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


    // ============================================
    // RETRY OF PREVIOUS COMPLETED REQUEST
    // ============================================

    const existing =
      await prisma.saleReturn.findUnique({

        where: {
          id:
            returnId,
        },

        include:
          returnInclude,
      });


    if (!existing) {

      const error =
        new Error(
          "Return not found"
        );

      error.statusCode = 404;

      throw error;
    }


    if (
      existing.status ===
        "COMPLETED" &&
      existing.refundIdempotencyKey ===
        idempotencyKey
    ) {

      return {

        saleReturn:
          addReturnSummary(
            existing
          ),

        duplicateRequest:
          true,
      };
    }


    return runSerializableTransaction(
      async (tx) => {

        // ==========================================
        // RETURN
        // ==========================================

        const saleReturn =
          await tx.saleReturn.findUnique({

            where: {
              id:
                returnId,
            },

            include: {

              items:
                true,

              sale:
                true,

              branch:
                true,
            },
          });


        if (!saleReturn) {

          const error =
            new Error(
              "Return not found"
            );

          error.statusCode = 404;

          throw error;
        }


        if (
          saleReturn.branchId !==
          user.branchId
        ) {

          const error =
            new Error(
              "You cannot refund another branch's return"
            );

          error.statusCode = 403;

          throw error;
        }


        if (
          saleReturn.status !==
          "APPROVED"
        ) {

          const error =
            new Error(
              "Return must be approved before refund"
            );

          error.statusCode = 400;

          throw error;
        }


        // ==========================================
        // CLAIM RETURN
        // ==========================================

        const claimed =
          await tx.saleReturn.updateMany({

            where: {

              id:
                saleReturn.id,

              status:
                "APPROVED",
            },

            data: {

              status:
                "PROCESSING",

              refundIdempotencyKey:
                idempotencyKey,
            },
          });


        if (
          claimed.count !== 1
        ) {

          const error =
            new Error(
              "Return is already being processed"
            );

          error.statusCode = 409;

          throw error;
        }


        // ==========================================
        // ACTIVE CASHIER SHIFT
        // ==========================================

        const shift =
          await tx.cashierShift.findFirst({

            where: {

              cashierId:
                user.id,

              status:
                "OPEN",
            },

            include: {

              branch:
                true,

              terminal: {

                include: {
                  cashDrawer:
                    true,
                },
              },
            },
          });


        if (!shift) {

          const error =
            new Error(
              "Open a cashier shift before processing a refund"
            );

          error.statusCode = 400;

          throw error;
        }


        if (
          shift.branchId !==
          saleReturn.branchId
        ) {

          const error =
            new Error(
              "Active shift belongs to another branch"
            );

          error.statusCode = 403;

          throw error;
        }


        if (
          shift.branch.status !==
          "ACTIVE"
        ) {

          const error =
            new Error(
              "Branch is not active"
            );

          error.statusCode = 400;

          throw error;
        }


        if (
          shift.terminal.status !==
          "ACTIVE"
        ) {

          const error =
            new Error(
              "Terminal is not active"
            );

          error.statusCode = 400;

          throw error;
        }


        // ==========================================
        // REFUND ALLOCATIONS
        // ==========================================

        const allocations =
          Array.isArray(refunds)
            ? refunds
            : [];


        if (
          saleReturn.refundTotal.gt(0) &&
          allocations.length === 0
        ) {

          const error =
            new Error(
              "Refund payment allocation is required"
            );

          error.statusCode = 400;

          throw error;
        }


        if (
          saleReturn.refundTotal.eq(0) &&
          allocations.length > 0
        ) {

          const error =
            new Error(
              "This return does not require a monetary refund"
            );

          error.statusCode = 400;

          throw error;
        }


        // Prevent same payment appearing twice
        const paymentIds =
          new Set();


        for (
          const allocation of
            allocations
        ) {

          if (
            paymentIds.has(
              allocation.paymentId
            )
          ) {

            const error =
              new Error(
                "Duplicate payment refund allocations are not allowed"
              );

            error.statusCode = 400;

            throw error;
          }


          paymentIds.add(
            allocation.paymentId
          );
        }


        // ==========================================
        // TOTAL ALLOCATED
        // ==========================================

        const allocatedTotal =
          allocations.reduce(
            (
              total,
              allocation
            ) =>
              total.plus(
                money(
                  allocation.amount
                )
              ),

            zero()
          );


        if (
          !allocatedTotal.eq(
            saleReturn.refundTotal
          )
        ) {

          const error =
            new Error(
              `Refund allocations must equal ${saleReturn.refundTotal.toFixed(2)}. Received: ${allocatedTotal.toFixed(2)}`
            );

          error.statusCode = 400;

          throw error;
        }


        // ==========================================
        // VALIDATE ORIGINAL PAYMENTS
        // ==========================================

        const validatedAllocations =
          [];


        let totalCashRefund =
          zero();


        for (
          const allocation of
            allocations
        ) {

          const amount =
            money(
              allocation.amount
            );


          if (
            amount.lte(0)
          ) {

            const error =
              new Error(
                "Refund amount must be greater than zero"
              );

            error.statusCode = 400;

            throw error;
          }


          const payment =
            await tx.payment.findUnique({

              where: {
                id:
                  allocation.paymentId,
              },
            });


          if (!payment) {

            const error =
              new Error(
                "Original payment not found"
              );

            error.statusCode = 404;

            throw error;
          }


          if (
            payment.saleId !==
            saleReturn.saleId
          ) {

            const error =
              new Error(
                "Payment does not belong to the original sale"
              );

            error.statusCode = 400;

            throw error;
          }


          if (
            payment.status !==
            "COMPLETED"
          ) {

            const error =
              new Error(
                "Only completed payments can be refunded"
              );

            error.statusCode = 400;

            throw error;
          }


          // ========================================
          // PREVIOUS REFUNDS FOR PAYMENT
          // ========================================

          const previousRefund =
            await tx.refund.aggregate({

              where: {

                paymentId:
                  payment.id,

                status:
                  "COMPLETED",
              },

              _sum: {
                amount:
                  true,
              },
            });


          const refundedAlready =
            previousRefund._sum.amount ??
            zero();


          const refundableRemaining =
            payment.amount.minus(
              refundedAlready
            );


          if (
            amount.gt(
              refundableRemaining
            )
          ) {

            const error =
              new Error(
                `Refund exceeds remaining refundable amount for payment ${payment.paymentNumber}. Remaining: ${refundableRemaining.toFixed(2)}`
              );

            error.statusCode = 400;

            throw error;
          }


          // ========================================
          // CARD / QR REFUND REFERENCE
          // ========================================

          if (
            ["CARD", "QR"].includes(
              payment.method
            ) &&
            !allocation
              .transactionReference
              ?.trim()
          ) {

            const error =
              new Error(
                `Refund transaction reference is required for ${payment.method}`
              );

            error.statusCode = 400;

            throw error;
          }


          if (
            payment.method ===
            "CASH"
          ) {

            totalCashRefund =
              totalCashRefund.plus(
                amount
              );
          }


          validatedAllocations.push({

            payment,

            amount,

            transactionReference:
              allocation
                .transactionReference
                ?.trim() ||
              null,

            note:
              allocation.note
                ?.trim() ||
              null,
          });
        }


        // ==========================================
        // CASH DRAWER VALIDATION
        // ==========================================

        const drawer =
          shift.terminal.cashDrawer;


        let expectedCashBefore =
          calculateExpectedCash(
            shift
          );


        if (
          totalCashRefund.gt(0)
        ) {

          if (!drawer) {

            const error =
              new Error(
                "No cash drawer is configured for the active terminal"
              );

            error.statusCode = 400;

            throw error;
          }


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
            totalCashRefund.gt(
              expectedCashBefore
            )
          ) {

            const error =
              new Error(
                `Insufficient expected cash in drawer. Available: ${expectedCashBefore.toFixed(2)}`
              );

            error.statusCode = 400;

            throw error;
          }
        }


        // ==========================================
        // CREATE REFUND RECORDS
        // ==========================================

        let runningCashBalance =
          expectedCashBefore;


        for (
          const allocation of
            validatedAllocations
        ) {

          const refund =
            await tx.refund.create({

              data: {

                refundNumber:
                  generateRefundNumber(),

                status:
                  "COMPLETED",

                method:
                  allocation.payment.method,

                amount:
                  allocation.amount,

                transactionReference:
                  allocation
                    .transactionReference,

                note:
                  allocation.note,

                saleReturnId:
                  saleReturn.id,

                paymentId:
                  allocation.payment.id,

                shiftId:
                  shift.id,

                processedById:
                  user.id,

                drawerId:
                  allocation.payment
                    .method ===
                    "CASH"
                    ? drawer.id
                    : null,
              },
            });


          // ========================================
          // CASH DRAWER TRANSACTION
          // ========================================

          if (
            allocation.payment.method ===
            "CASH"
          ) {

            const balanceBefore =
              runningCashBalance;


            const balanceAfter =
              balanceBefore.minus(
                allocation.amount
              );


            await tx
              .cashDrawerTransaction
              .create({

                data: {

                  type:
                    "REFUND",

                  amount:
                    allocation.amount,

                  balanceBefore,

                  balanceAfter,

                  reason:
                    `Refund ${saleReturn.returnNumber}`,

                  referenceType:
                    "REFUND",

                  referenceId:
                    refund.id,

                  drawerId:
                    drawer.id,

                  shiftId:
                    shift.id,

                  createdById:
                    user.id,
                },
              });


            runningCashBalance =
              balanceAfter;
          }
        }


        // ==========================================
        // UPDATE SHIFT CASH REFUNDS
        // ==========================================

        if (
          totalCashRefund.gt(0)
        ) {

          await tx.cashierShift.update({

            where: {
              id:
                shift.id,
            },

            data: {

              cashRefunds: {
                increment:
                  totalCashRefund,
              },

              expectedCash:
                runningCashBalance,
            },
          });
        }


        // ==========================================
        // RESTORE INVENTORY
        // ==========================================

        for (
          const item of
            saleReturn.items
        ) {

          if (
            !item.trackInventory ||
            !item.restock
          ) {

            continue;
          }


          const inventory =
            await tx.inventory.findUnique({

              where: {

                branchId_productId: {

                  branchId:
                    saleReturn.branchId,

                  productId:
                    item.productId,
                },
              },
            });


          if (!inventory) {

            const error =
              new Error(
                `Inventory not found for ${item.productName}`
              );

            error.statusCode = 500;

            throw error;
          }


          const quantityBefore =
            inventory.quantity;


          const quantityAfter =
            quantityBefore.plus(
              item.baseQuantity
            );


          await tx.inventory.update({

            where: {
              id:
                inventory.id,
            },

            data: {
              quantity:
                quantityAfter,
            },
          });


          // ========================================
          // STOCK MOVEMENT
          // ========================================

          await tx.stockMovement.create({

            data: {

              movementType:
                "RETURN",

              quantity:
                item.baseQuantity,

              quantityBefore,

              quantityAfter,

              reason:
                `Customer return ${saleReturn.returnNumber}`,

              referenceType:
                "RETURN",

              referenceId:
                saleReturn.id,

              inventoryId:
                inventory.id,

              createdById:
                user.id,
            },
          });
        }


        // ==========================================
        // COMPLETE RETURN
        // ==========================================

        await tx.saleReturn.update({

          where: {
            id:
              saleReturn.id,
          },

          data: {

            status:
              "COMPLETED",

            completedById:
              user.id,

            completedAt:
              new Date(),
          },
        });


        // ==========================================
        // CALCULATE TOTAL REFUNDED FOR SALE
        // ==========================================

        const completedReturns =
          await tx.saleReturn.aggregate({

            where: {

              saleId:
                saleReturn.saleId,

              status:
                "COMPLETED",
            },

            _sum: {
              refundTotal:
                true,
            },
          });


        const totalSaleRefunded =
          completedReturns
            ._sum
            .refundTotal ??
          zero();


        // ==========================================
        // SALE STATUS
        // ==========================================

        const saleStatus =
          totalSaleRefunded.gte(
            saleReturn.sale.grandTotal
          )
            ? "REFUNDED"
            : "PARTIALLY_REFUNDED";


        await tx.sale.update({

          where: {
            id:
              saleReturn.saleId,
          },

          data: {
            status:
              saleStatus,
          },
        });


        // ==========================================
        // FINAL RETURN
        // ==========================================

        const completedReturn =
          await tx.saleReturn.findUnique({

            where: {
              id:
                saleReturn.id,
            },

            include:
              returnInclude,
          });


        return {

          saleReturn:
            addReturnSummary(
              completedReturn
            ),

          duplicateRequest:
            false,
        };
      }
    );
  };