import crypto from "crypto";
import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";

import {
  createAuditLog,
} from "./auditService.js";

import {
  AUDIT_MODULES,
  AUDIT_ACTIONS,
} from "../constants/auditActions.js";


// ======================================================
// DECIMAL HELPERS
// ======================================================

const zero = () =>
  new Prisma.Decimal(0);


const money = (value) =>
  new Prisma.Decimal(value || 0)
    .toDecimalPlaces(2);


// ======================================================
// SERIALIZABLE TRANSACTION
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
            Prisma
              .TransactionIsolationLevel
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
// REQUEST NUMBER
// ======================================================

const generateDiscountRequestNumber = () => {

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


  return `DISC-${date}-${random}`;
};


// ======================================================
// INCLUDE
// ======================================================

const discountInclude = {

  sale: {

    select: {

      id: true,

      saleNumber:
        true,

      invoiceNumber:
        true,

      status:
        true,

      subtotal:
        true,

      discountAmount:
        true,

      taxAmount:
        true,

      grandTotal:
        true,

      expiresAt:
        true,

      branchId:
        true,

      cashierId:
        true,
    },
  },


  branch: {

    select: {

      id: true,

      code:
        true,

      name:
        true,
    },
  },


  requestedBy: {

    select: {

      id: true,

      employeeId:
        true,

      firstName:
        true,

      lastName:
        true,
    },
  },


  appliedBy: {

    select: {

      id: true,

      employeeId:
        true,

      firstName:
        true,

      lastName:
        true,
    },
  },


  rejectedBy: {

    select: {

      id: true,

      employeeId:
        true,

      firstName:
        true,

      lastName:
        true,
    },
  },


  cancelledBy: {

    select: {

      id: true,

      employeeId:
        true,

      firstName:
        true,

      lastName:
        true,
    },
  },
};


// ======================================================
// ACCESS
// ======================================================

const validateDiscountAccess = (
  user,
  discount
) => {

  // ADMIN
  if (
    user.role === "ADMIN"
  ) {

    return;
  }


  // MANAGER
  if (
    user.role === "MANAGER"
  ) {

    if (!user.branchId) {

      const error =
        new Error(
          "Manager is not assigned to a branch"
        );

      error.statusCode = 403;

      throw error;
    }


    if (
      discount.branchId !==
      user.branchId
    ) {

      const error =
        new Error(
          "You cannot access discount requests from another branch"
        );

      error.statusCode = 403;

      throw error;
    }


    return;
  }


  // CASHIER
  if (
    user.role === "CASHIER"
  ) {

    if (
      discount.requestedById !==
      user.id
    ) {

      const error =
        new Error(
          "You cannot access another cashier's discount request"
        );

      error.statusCode = 403;

      throw error;
    }


    return;
  }


  const error =
    new Error(
      "You do not have permission to access this discount request"
    );

  error.statusCode = 403;

  throw error;
};


// ======================================================
// APPROVAL ACCESS
// ======================================================

const validateApprovalAccess = (
  user,
  discount
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
        "Only Manager or Admin can approve or reject manual discounts"
      );

    error.statusCode = 403;

    throw error;
  }


  if (
    !user.branchId ||
    discount.branchId !==
      user.branchId
  ) {

    const error =
      new Error(
        "You cannot manage another branch's discount request"
      );

    error.statusCode = 403;

    throw error;
  }
};


// ======================================================
// CHECK SALE CAN STILL CHANGE PRICE
//
// Important:
//
// Once payment begins, sale totals must be immutable.
// ======================================================

const validateSaleCanReceiveDiscount = async ({
  db,
  sale,
}) => {

  if (
    sale.status !==
    "PENDING_PAYMENT"
  ) {

    const error =
      new Error(
        "Manual discount can only be applied before payment starts"
      );

    error.statusCode = 400;

    throw error;
  }


  if (
    sale.expiresAt &&
    sale.expiresAt <=
      new Date()
  ) {

    const error =
      new Error(
        "Sale has expired"
      );

    error.statusCode = 400;

    throw error;
  }


  // ==================================================
  // PENDING or COMPLETED payment = payment has started
  //
  // FAILED payment does not lock sale pricing.
  // ==================================================

  const startedPaymentCount =
    await db.payment.count({

      where: {

        saleId:
          sale.id,

        status: {

          in: [
            "PENDING",
            "COMPLETED",
          ],
        },
      },
    });


  if (
    startedPaymentCount > 0
  ) {

    const error =
      new Error(
        "Sale already has a payment in progress or completed. Discount cannot be changed."
      );

    error.statusCode = 400;

    throw error;
  }
};


// ======================================================
// VALIDATE DISCOUNT VALUE
// ======================================================

const validateDiscountValue = (
  discountType,
  value
) => {

  const discountValue =
    money(value);


  if (
    discountValue.lte(0)
  ) {

    const error =
      new Error(
        "Discount value must be greater than zero"
      );

    error.statusCode = 400;

    throw error;
  }


  if (
    ![
      "PERCENTAGE",
      "FIXED_AMOUNT",
    ].includes(
      discountType
    )
  ) {

    const error =
      new Error(
        "Invalid discount type"
      );

    error.statusCode = 400;

    throw error;
  }


  if (
    discountType ===
      "PERCENTAGE" &&
    discountValue.gt(100)
  ) {

    const error =
      new Error(
        "Percentage discount cannot exceed 100%"
      );

    error.statusCode = 400;

    throw error;
  }


  return discountValue;
};


// ======================================================
// CREATE DISCOUNT REQUEST
// ======================================================

export const createDiscountRequest = async ({
  user,
  saleId,
  discountType,
  value,
  reason,
  auditContext = {},
}) => {

  // ==================================================
  // CASHIER
  // ==================================================

  if (
    user.role !== "CASHIER"
  ) {

    const error =
      new Error(
        "Only cashier can request a manual discount"
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


  const discountValue =
    validateDiscountValue(
      discountType,
      value
    );


  if (
    !reason ||
    !reason.trim()
  ) {

    const error =
      new Error(
        "Discount reason is required"
      );

    error.statusCode = 400;

    throw error;
  }


  return runSerializableTransaction(
    async (tx) => {

      // ============================================
      // SALE
      // ============================================

      const sale =
        await tx.sale.findUnique({

          where: {
            id:
              saleId,
          },

          include: {

            branch:
              true,
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


      // ============================================
      // OWN SALE
      // ============================================

      if (
        sale.cashierId !==
        user.id
      ) {

        const error =
          new Error(
            "You can only request discount for your own sale"
          );

        error.statusCode = 403;

        throw error;
      }


      if (
        sale.branchId !==
        user.branchId
      ) {

        const error =
          new Error(
            "Sale belongs to another branch"
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
      // SALE MUST STILL BE EDITABLE
      // ============================================

      await validateSaleCanReceiveDiscount({

        db:
          tx,

        sale,
      });


      // ============================================
      // ONLY ONE PENDING REQUEST AT A TIME
      // ============================================

      const pendingRequest =
        await tx.manualDiscount.findFirst({

          where: {

            saleId:
              sale.id,

            status:
              "PENDING",
          },
        });


      if (pendingRequest) {

        const error =
          new Error(
            `A pending discount request already exists: ${pendingRequest.requestNumber}`
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // CREATE
      // ============================================

      const discount =
        await tx.manualDiscount.create({

          data: {

            requestNumber:
              generateDiscountRequestNumber(),


            saleId:
              sale.id,


            branchId:
              sale.branchId,


            discountType,


            value:
              discountValue,


            appliedAmount:
              zero(),


            reason:
              reason.trim(),


            status:
              "PENDING",


            requestedById:
              user.id,
          },

          include:
            discountInclude,
        });


      // ============================================
      // AUDIT
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          sale.branchId,


        module:
          AUDIT_MODULES.DISCOUNT,


        action:
          AUDIT_ACTIONS
            .DISCOUNT_REQUESTED,


        entityType:
          "MANUAL_DISCOUNT",


        entityId:
          discount.id,


        description:
          `Manual discount ${discount.requestNumber} requested for sale ${sale.saleNumber}`,


        severity:
          "WARNING",


        afterData: {

          requestNumber:
            discount.requestNumber,

          status:
            "PENDING",

          saleId:
            sale.id,

          saleNumber:
            sale.saleNumber,

          discountType,

          value:
            discountValue,

          reason:
            reason.trim(),
        },


        metadata: {

          saleSubtotal:
            sale.subtotal,

          currentDiscount:
            sale.discountAmount,

          currentGrandTotal:
            sale.grandTotal,
        },


        request:
          auditContext,
      });


      return discount;
    }
  );
};


// ======================================================
// GET ALL DISCOUNT REQUESTS
// ======================================================

export const getDiscountRequests = async ({
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


  // ==================================================
  // CASHIER
  // ==================================================

  if (
    user.role === "CASHIER"
  ) {

    where.requestedById =
      user.id;
  }


  // ==================================================
  // MANAGER
  // ==================================================

  if (
    user.role === "MANAGER"
  ) {

    if (!user.branchId) {

      const error =
        new Error(
          "Manager is not assigned to a branch"
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


  // ==================================================
  // ADMIN
  // ==================================================

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
        requestNumber: {

          contains:
            search,

          mode:
            "insensitive",
        },
      },


      {
        reason: {

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
    ];
  }


  const [
    discounts,
    total,
  ] =
    await prisma.$transaction([

      prisma.manualDiscount.findMany({

        where,

        skip,

        take:
          limit,

        include:
          discountInclude,

        orderBy: {
          requestedAt:
            "desc",
        },
      }),


      prisma.manualDiscount.count({
        where,
      }),
    ]);


  return {

    discounts,


    pagination: {

      page,

      limit,

      total,

      totalPages:
        Math.ceil(
          total /
          limit
        ),
    },
  };
};


// ======================================================
// GET ONE
// ======================================================

export const getDiscountRequestById = async ({
  user,
  discountId,
}) => {

  const discount =
    await prisma.manualDiscount.findUnique({

      where: {
        id:
          discountId,
      },

      include:
        discountInclude,
    });


  if (!discount) {

    const error =
      new Error(
        "Discount request not found"
      );

    error.statusCode = 404;

    throw error;
  }


  validateDiscountAccess(
    user,
    discount
  );


  return discount;
};


// ======================================================
// APPROVE / APPLY DISCOUNT
// ======================================================

export const approveDiscountRequest = async ({
  user,
  discountId,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      // ============================================
      // REQUEST
      // ============================================

      const discount =
        await tx.manualDiscount.findUnique({

          where: {
            id:
              discountId,
          },

          include: {

            sale: {

              include: {

                items: {

                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },
              },
            },
          },
        });


      if (!discount) {

        const error =
          new Error(
            "Discount request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      validateApprovalAccess(
        user,
        discount
      );


      if (
        discount.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending discount requests can be approved"
          );

        error.statusCode = 400;

        throw error;
      }


      const sale =
        discount.sale;


      // ============================================
      // SALE STILL EDITABLE
      // ============================================

      await validateSaleCanReceiveDiscount({

        db:
          tx,

        sale,
      });


      // ============================================
      // CALCULATE CURRENT REMAINING SUBTOTAL
      //
      // SaleItem.discountAmount already contains
      // promotion discounts and previous manual
      // discounts.
      // ============================================

      const itemStates =
        sale.items.map(
          (item) => {

            let remainingBase =
              item.lineSubtotal.minus(
                item.discountAmount
              );


            if (
              remainingBase.lt(0)
            ) {

              remainingBase =
                zero();
            }


            return {

              item,

              remainingBase,
            };
          }
        );


      const remainingSubtotal =
        itemStates.reduce(
          (
            total,
            state
          ) =>
            total.plus(
              state.remainingBase
            ),

          zero()
        );


      if (
        remainingSubtotal.lte(0)
      ) {

        const error =
          new Error(
            "Sale has no remaining amount available for manual discount"
          );

        error.statusCode = 400;

        throw error;
      }


      // ============================================
      // ACTUAL MANUAL DISCOUNT
      // ============================================

      let manualDiscountAmount;


      if (
        discount.discountType ===
        "PERCENTAGE"
      ) {

        manualDiscountAmount =
          money(
            remainingSubtotal
              .mul(
                discount.value
              )
              .div(100)
          );

      } else {

        manualDiscountAmount =
          money(
            discount.value
          );
      }


      // Never exceed remaining merchandise subtotal.
      if (
        manualDiscountAmount.gt(
          remainingSubtotal
        )
      ) {

        manualDiscountAmount =
          money(
            remainingSubtotal
          );
      }


      if (
        manualDiscountAmount.lte(0)
      ) {

        const error =
          new Error(
            "Calculated manual discount is zero"
          );

        error.statusCode = 400;

        throw error;
      }


      // ============================================
      // ELIGIBLE ITEMS
      // ============================================

      const eligibleItems =
        itemStates.filter(
          (state) =>
            state.remainingBase.gt(0)
        );


      if (
        eligibleItems.length === 0
      ) {

        const error =
          new Error(
            "No sale item is eligible for manual discount"
          );

        error.statusCode = 400;

        throw error;
      }


      // ============================================
      // DISTRIBUTE MANUAL DISCOUNT
      //
      // Proportional allocation.
      //
      // Last item receives rounding residual.
      // ============================================

      let allocated =
        zero();


      const allocationMap =
        new Map();


      for (
        let index = 0;
        index <
        eligibleItems.length;
        index++
      ) {

        const state =
          eligibleItems[index];


        let allocation;


        const isLast =
          index ===
          eligibleItems.length - 1;


        if (isLast) {

          allocation =
            money(
              manualDiscountAmount.minus(
                allocated
              )
            );

        } else {

          const ratio =
            state
              .remainingBase
              .div(
                remainingSubtotal
              );


          allocation =
            money(
              manualDiscountAmount.mul(
                ratio
              )
            );
        }


        // Safety:
        // never discount item below zero.
        if (
          allocation.gt(
            state.remainingBase
          )
        ) {

          allocation =
            money(
              state.remainingBase
            );
        }


        if (
          allocation.lt(0)
        ) {

          allocation =
            zero();
        }


        allocationMap.set(
          state.item.id,
          allocation
        );


        allocated =
          allocated.plus(
            allocation
          );
      }


      // ============================================
      // ROUNDING RESIDUAL SAFETY
      // ============================================

      let allocationDifference =
        money(
          manualDiscountAmount.minus(
            allocated
          )
        );


      if (
        !allocationDifference.eq(0)
      ) {

        for (
          let index =
            eligibleItems.length - 1;
          index >= 0;
          index--
        ) {

          const state =
            eligibleItems[index];


          const currentAllocation =
            allocationMap.get(
              state.item.id
            ) || zero();


          const available =
            state
              .remainingBase
              .minus(
                currentAllocation
              );


          if (
            allocationDifference.gt(0)
          ) {

            const extra =
              Prisma.Decimal.min(
                available,
                allocationDifference
              );


            if (
              extra.gt(0)
            ) {

              allocationMap.set(
                state.item.id,

                money(
                  currentAllocation.plus(
                    extra
                  )
                )
              );


              allocationDifference =
                money(
                  allocationDifference.minus(
                    extra
                  )
                );
            }

          } else {

            const removable =
              Prisma.Decimal.min(
                currentAllocation,
                allocationDifference.abs()
              );


            if (
              removable.gt(0)
            ) {

              allocationMap.set(
                state.item.id,

                money(
                  currentAllocation.minus(
                    removable
                  )
                )
              );


              allocationDifference =
                money(
                  allocationDifference.plus(
                    removable
                  )
                );
            }
          }


          if (
            allocationDifference.eq(0)
          ) {

            break;
          }
        }
      }


      // ============================================
      // RECOMPUTE EVERY SALE ITEM
      //
      // Important correction:
      //
      // Totals are calculated from ALL items,
      // including items that had no remaining
      // discountable amount.
      // ============================================

      let finalSubtotal =
        zero();

      let finalDiscountTotal =
        zero();

      let finalTaxTotal =
        zero();

      let finalGrandTotal =
        zero();


      const itemAuditChanges =
        [];


      for (
        const state of
          itemStates
      ) {

        const item =
          state.item;


        const allocation =
          allocationMap.get(
            item.id
          ) || zero();


        const oldDiscount =
          money(
            item.discountAmount
          );


        let newDiscount =
          money(
            oldDiscount.plus(
              allocation
            )
          );


        // Discount cannot exceed line subtotal.
        if (
          newDiscount.gt(
            item.lineSubtotal
          )
        ) {

          newDiscount =
            money(
              item.lineSubtotal
            );
        }


        let taxableAmount =
          money(
            item.lineSubtotal.minus(
              newDiscount
            )
          );


        if (
          taxableAmount.lt(0)
        ) {

          taxableAmount =
            zero();
        }


        const newTaxAmount =
          money(
            taxableAmount
              .mul(
                item.taxRate
              )
              .div(100)
          );


        const newLineTotal =
          money(
            taxableAmount.plus(
              newTaxAmount
            )
          );


        // ==========================================
        // UPDATE ITEM
        // ==========================================

        await tx.saleItem.update({

          where: {
            id:
              item.id,
          },

          data: {

            discountAmount:
              newDiscount,

            taxAmount:
              newTaxAmount,

            lineTotal:
              newLineTotal,
          },
        });


        // ==========================================
        // AGGREGATE SALE TOTALS
        // ==========================================

        finalSubtotal =
          finalSubtotal.plus(
            item.lineSubtotal
          );


        finalDiscountTotal =
          finalDiscountTotal.plus(
            newDiscount
          );


        finalTaxTotal =
          finalTaxTotal.plus(
            newTaxAmount
          );


        finalGrandTotal =
          finalGrandTotal.plus(
            newLineTotal
          );


        if (
          allocation.gt(0)
        ) {

          itemAuditChanges.push({

            saleItemId:
              item.id,

            productId:
              item.productId,

            productName:
              item.productName,

            oldDiscount,

            manualDiscount:
              allocation,

            newDiscount,

            oldTax:
              item.taxAmount,

            newTax:
              newTaxAmount,

            oldLineTotal:
              item.lineTotal,

            newLineTotal,
          });
        }
      }


      finalSubtotal =
        money(
          finalSubtotal
        );


      finalDiscountTotal =
        money(
          finalDiscountTotal
        );


      finalTaxTotal =
        money(
          finalTaxTotal
        );


      finalGrandTotal =
        money(
          finalGrandTotal
        );


      if (
        finalGrandTotal.lt(0)
      ) {

        const error =
          new Error(
            "Sale grand total cannot become negative"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // UPDATE SALE
      // ============================================

      const updatedSale =
        await tx.sale.update({

          where: {
            id:
              sale.id,
          },

          data: {

            subtotal:
              finalSubtotal,

            discountAmount:
              finalDiscountTotal,

            taxAmount:
              finalTaxTotal,

            grandTotal:
              finalGrandTotal,
          },
        });


      // ============================================
      // APPLY REQUEST
      // ============================================

      const appliedAt =
        new Date();


      const result =
        await tx.manualDiscount.updateMany({

          where: {

            id:
              discount.id,

            status:
              "PENDING",
          },

          data: {

            status:
              "APPLIED",

            appliedAmount:
              manualDiscountAmount,

            appliedById:
              user.id,

            appliedAt,
          },
        });


      if (
        result.count !== 1
      ) {

        const error =
          new Error(
            "Discount request status changed while approving"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // DISCOUNT_APPLIED
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          discount.branchId,


        module:
          AUDIT_MODULES.DISCOUNT,


        action:
          AUDIT_ACTIONS
            .DISCOUNT_APPLIED,


        entityType:
          "MANUAL_DISCOUNT",


        entityId:
          discount.id,


        description:
          `Manual discount ${discount.requestNumber} applied to sale ${sale.saleNumber}`,


        severity:
          "WARNING",


        beforeData: {

          requestStatus:
            "PENDING",

          sale: {

            subtotal:
              sale.subtotal,

            discountAmount:
              sale.discountAmount,

            taxAmount:
              sale.taxAmount,

            grandTotal:
              sale.grandTotal,
          },
        },


        afterData: {

          requestStatus:
            "APPLIED",

          appliedAmount:
            manualDiscountAmount,

          sale: {

            subtotal:
              updatedSale.subtotal,

            discountAmount:
              updatedSale.discountAmount,

            taxAmount:
              updatedSale.taxAmount,

            grandTotal:
              updatedSale.grandTotal,
          },
        },


        metadata: {

          requestNumber:
            discount.requestNumber,

          saleId:
            sale.id,

          saleNumber:
            sale.saleNumber,

          discountType:
            discount.discountType,

          requestedValue:
            discount.value,

          actualAppliedAmount:
            manualDiscountAmount,

          reason:
            discount.reason,

          itemChanges:
            itemAuditChanges,
        },


        request:
          auditContext,
      });
    }
  );


  return getDiscountRequestById({

    user,

    discountId,
  });
};


// ======================================================
// REJECT DISCOUNT
// ======================================================

export const rejectDiscountRequest = async ({
  user,
  discountId,
  reason,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      const discount =
        await tx.manualDiscount.findUnique({

          where: {
            id:
              discountId,
          },

          include: {
            sale:
              true,
          },
        });


      if (!discount) {

        const error =
          new Error(
            "Discount request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      validateApprovalAccess(
        user,
        discount
      );


      if (
        discount.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending discount requests can be rejected"
          );

        error.statusCode = 400;

        throw error;
      }


      if (
        !reason ||
        !reason.trim()
      ) {

        const error =
          new Error(
            "Rejection reason is required"
          );

        error.statusCode = 400;

        throw error;
      }


      const rejectedAt =
        new Date();


      const result =
        await tx.manualDiscount.updateMany({

          where: {

            id:
              discount.id,

            status:
              "PENDING",
          },

          data: {

            status:
              "REJECTED",

            rejectedById:
              user.id,

            rejectedAt,

            rejectionReason:
              reason.trim(),
          },
        });


      if (
        result.count !== 1
      ) {

        const error =
          new Error(
            "Discount request status changed while rejecting"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          discount.branchId,


        module:
          AUDIT_MODULES.DISCOUNT,


        action:
          AUDIT_ACTIONS
            .DISCOUNT_REJECTED,


        entityType:
          "MANUAL_DISCOUNT",


        entityId:
          discount.id,


        description:
          `Manual discount ${discount.requestNumber} rejected`,


        severity:
          "WARNING",


        beforeData: {

          status:
            "PENDING",
        },


        afterData: {

          status:
            "REJECTED",

          rejectionReason:
            reason.trim(),

          rejectedAt,
        },


        metadata: {

          saleId:
            discount.saleId,

          saleNumber:
            discount.sale
              .saleNumber,

          discountType:
            discount.discountType,

          value:
            discount.value,

          originalReason:
            discount.reason,
        },


        request:
          auditContext,
      });
    }
  );


  return getDiscountRequestById({

    user,

    discountId,
  });
};


// ======================================================
// CANCEL DISCOUNT REQUEST
// ======================================================

export const cancelDiscountRequest = async ({
  user,
  discountId,
  reason,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      const discount =
        await tx.manualDiscount.findUnique({

          where: {
            id:
              discountId,
          },

          include: {
            sale:
              true,
          },
        });


      if (!discount) {

        const error =
          new Error(
            "Discount request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      // ============================================
      // ACCESS
      // ============================================

      validateDiscountAccess(
        user,
        discount
      );


      if (
        discount.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending discount requests can be cancelled"
          );

        error.statusCode = 400;

        throw error;
      }


      // Cashier can only cancel own request.
      if (
        user.role === "CASHIER" &&
        discount.requestedById !==
          user.id
      ) {

        const error =
          new Error(
            "You cannot cancel another cashier's discount request"
          );

        error.statusCode = 403;

        throw error;
      }


      const cancelReason =
        reason?.trim() ||
        "Discount request cancelled";


      const cancelledAt =
        new Date();


      const result =
        await tx.manualDiscount.updateMany({

          where: {

            id:
              discount.id,

            status:
              "PENDING",
          },

          data: {

            status:
              "CANCELLED",

            cancelledById:
              user.id,

            cancelledAt,

            cancelReason,
          },
        });


      if (
        result.count !== 1
      ) {

        const error =
          new Error(
            "Discount request status changed while cancelling"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          discount.branchId,


        module:
          AUDIT_MODULES.DISCOUNT,


        action:
          AUDIT_ACTIONS
            .DISCOUNT_CANCELLED,


        entityType:
          "MANUAL_DISCOUNT",


        entityId:
          discount.id,


        description:
          `Manual discount ${discount.requestNumber} cancelled`,


        severity:
          "WARNING",


        beforeData: {

          status:
            "PENDING",
        },


        afterData: {

          status:
            "CANCELLED",

          cancelReason,

          cancelledAt,
        },


        metadata: {

          saleId:
            discount.saleId,

          saleNumber:
            discount.sale
              .saleNumber,

          discountType:
            discount.discountType,

          value:
            discount.value,
        },


        request:
          auditContext,
      });
    }
  );


  return getDiscountRequestById({

    user,

    discountId,
  });
};