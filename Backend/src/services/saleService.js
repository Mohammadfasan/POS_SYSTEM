import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ======================================================
// CONFIGURATION
// ======================================================

const PENDING_SALE_MINUTES = 30;


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


// ======================================================
// SERIALIZABLE TRANSACTION WITH RETRY
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

      // Prisma transaction conflict/deadlock
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
// GENERATE SALE NUMBER
// ======================================================

const generateSaleNumber = (
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

  return `SL-${branchCode}-${date}-${random}`;
};


// ======================================================
// SALE INCLUDE
// ======================================================

const saleInclude = {
  cashier: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },

  branch: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  terminal: {
    select: {
      id: true,
      code: true,
      name: true,
      location: true,
    },
  },

  shift: {
    select: {
      id: true,
      shiftNumber: true,
      status: true,
      openedAt: true,
      closedAt: true,
    },
  },

  items: {
    orderBy: {
      createdAt: "asc",
    },
  },

  payments: {
    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      paymentNumber: true,
      method: true,
      status: true,
      amount: true,
      tenderedAmount: true,
      changeAmount: true,
      transactionReference: true,
      createdAt: true,
    },
  },

  // Held Bill source
  sourceHeldBill: {
    select: {
      id: true,
      holdNumber: true,
      status: true,
      heldAt: true,
      resumedAt: true,
    },
  },
};


// ======================================================
// PAYMENT SUMMARY
// ======================================================

const addPaymentSummary = (
  sale
) => {
  const completedPayments =
    sale.payments?.filter(
      (payment) =>
        payment.status === "COMPLETED"
    ) || [];


  const paidAmount =
    completedPayments.reduce(
      (total, payment) =>
        total.plus(
          payment.amount
        ),

      new Prisma.Decimal(0)
    );


  let remainingAmount =
    sale.grandTotal.minus(
      paidAmount
    );


  if (
    remainingAmount.lt(0)
  ) {
    remainingAmount =
      new Prisma.Decimal(0);
  }


  return {
    ...sale,

    paymentSummary: {
      paidAmount:
        money(paidAmount),

      remainingAmount:
        money(
          remainingAmount
        ),

      fullyPaid:
        remainingAmount.lte(0),
    },
  };
};


// ======================================================
// VALIDATE SALE ACCESS
// ======================================================

const validateSaleAccess = (
  user,
  sale
) => {

  // ADMIN → all sales
  if (
    user.role === "ADMIN"
  ) {
    return;
  }


  // MANAGER → own branch
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
      sale.branchId !==
      user.branchId
    ) {
      const error =
        new Error(
          "You cannot access sales from another branch"
        );

      error.statusCode = 403;
      throw error;
    }

    return;
  }


  // CASHIER → own sales
  if (
    user.role === "CASHIER" &&
    sale.cashierId !== user.id
  ) {
    const error =
      new Error(
        "You cannot access another cashier's sale"
      );

    error.statusCode = 403;
    throw error;
  }
};


// ======================================================
// CREATE SALE
//
// Normal:
// createSale({ user, items })
//
// Held Bill:
// createSale({
//   user,
//   items,
//   sourceHeldBillId
// })
// ======================================================

export const createSale = async ({
  user,
  items,
  sourceHeldBillId = null,
}) => {

  // ==================================================
  // CASHIER VALIDATION
  // ==================================================

  if (
    user.role !== "CASHIER"
  ) {
    const error =
      new Error(
        "Only cashier can create POS sales"
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
        "Sale must contain at least one item"
      );

    error.statusCode = 400;
    throw error;
  }


  // ==================================================
  // HELD BILL IDEMPOTENCY
  //
  // If this HeldBill was already converted to a Sale,
  // return the existing Sale instead of creating
  // another one.
  // ==================================================

  if (sourceHeldBillId) {

    const existingSale =
      await prisma.sale.findUnique({
        where: {
          sourceHeldBillId,
        },

        include:
          saleInclude,
      });


    if (existingSale) {
      return addPaymentSummary(
        existingSale
      );
    }
  }


  // ==================================================
  // DATABASE TRANSACTION
  // ==================================================

  try {

    return await runSerializableTransaction(
      async (tx) => {

        // ============================================
        // ACTIVE CASHIER SHIFT
        // ============================================

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
              "Open a cashier shift before creating a sale"
            );

          error.statusCode = 403;
          throw error;
        }


        // ============================================
        // BRANCH VALIDATION
        // ============================================

        if (
          shift.branchId !==
          user.branchId
        ) {
          const error =
            new Error(
              "Cashier shift branch does not match assigned branch"
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


        // ============================================
        // TERMINAL VALIDATION
        // ============================================

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


        // ============================================
        // CASH DRAWER VALIDATION
        // ============================================

        const cashDrawer =
          shift.terminal.cashDrawer;


        if (!cashDrawer) {
          const error =
            new Error(
              "No cash drawer is configured for the active terminal"
            );

          error.statusCode = 400;
          throw error;
        }


        if (
          cashDrawer.status !==
          "ACTIVE"
        ) {
          const error =
            new Error(
              "An active cash drawer is required"
            );

          error.statusCode = 400;
          throw error;
        }


        // ============================================
        // VALIDATE SOURCE HELD BILL
        // ============================================

        if (sourceHeldBillId) {

          const heldBill =
            await tx.heldBill.findUnique({
              where: {
                id:
                  sourceHeldBillId,
              },
            });


          if (!heldBill) {
            const error =
              new Error(
                "Source held bill not found"
              );

            error.statusCode = 404;
            throw error;
          }


          if (
            heldBill.cashierId !==
            user.id
          ) {
            const error =
              new Error(
                "You cannot resume another cashier's held bill"
              );

            error.statusCode = 403;
            throw error;
          }


          if (
            heldBill.branchId !==
            shift.branchId
          ) {
            const error =
              new Error(
                "Held bill belongs to another branch"
              );

            error.statusCode = 403;
            throw error;
          }


          if (
            ![
              "HELD",
              "RESUMING",
            ].includes(
              heldBill.status
            )
          ) {
            const error =
              new Error(
                "Held bill cannot be converted to a sale"
              );

            error.statusCode = 400;
            throw error;
          }


          if (
            heldBill.expiresAt &&
            heldBill.expiresAt <=
              new Date()
          ) {
            const error =
              new Error(
                "Held bill has expired"
              );

            error.statusCode = 400;
            throw error;
          }
        }


        // ============================================
        // DUPLICATE PRODUCT + UNIT CHECK
        // ============================================

        const itemKeys =
          new Set();


        for (
          const item of items
        ) {

          const key =
            `${item.productId}:${item.unitId}`;


          if (
            itemKeys.has(key)
          ) {
            const error =
              new Error(
                "Duplicate product/unit lines found. Combine their quantities."
              );

            error.statusCode = 400;
            throw error;
          }


          itemKeys.add(
            key
          );
        }


        // ============================================
        // TOTALS
        // ============================================

        let subtotal =
          new Prisma.Decimal(0);

        let discountAmount =
          new Prisma.Decimal(0);

        let taxAmount =
          new Prisma.Decimal(0);

        const preparedItems =
          [];


        // ============================================
        // PROCESS ITEMS
        // ============================================

        for (
          const item of items
        ) {

          const enteredQuantity =
            quantityDecimal(
              item.quantity
            );


          if (
            enteredQuantity.lte(0)
          ) {
            const error =
              new Error(
                "Product quantity must be greater than zero"
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // PRODUCT
          // ========================================

          const product =
            await tx.product.findUnique({
              where: {
                id:
                  item.productId,
              },

              include: {
                category:
                  true,

                baseUnit:
                  true,

                sellingUnit:
                  true,
              },
            });


          if (!product) {
            const error =
              new Error(
                `Product not found: ${item.productId}`
              );

            error.statusCode = 404;
            throw error;
          }


          if (
            product.status !==
            "ACTIVE"
          ) {
            const error =
              new Error(
                `${product.name} is not active`
              );

            error.statusCode = 400;
            throw error;
          }


          if (
            product.category.status !==
            "ACTIVE"
          ) {
            const error =
              new Error(
                `${product.name} category is inactive`
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // SELECTED UNIT
          // ========================================

          const selectedUnit =
            await tx.unit.findUnique({
              where: {
                id:
                  item.unitId,
              },
            });


          if (!selectedUnit) {
            const error =
              new Error(
                `Selected unit not found for ${product.name}`
              );

            error.statusCode = 404;
            throw error;
          }


          if (
            selectedUnit.status !==
            "ACTIVE"
          ) {
            const error =
              new Error(
                `${selectedUnit.name} unit is inactive`
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // UNIT TYPE VALIDATION
          // ========================================

          if (
            selectedUnit.measurementType !==
            product.baseUnit.measurementType
          ) {
            const error =
              new Error(
                `${selectedUnit.name} cannot be used for ${product.name}`
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // FRACTIONAL QUANTITY CHECK
          // ========================================

          if (
            !product.allowFractionalQuantity &&
            !enteredQuantity.isInteger()
          ) {
            const error =
              new Error(
                `${product.name} must be sold using whole quantities`
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // CONVERT TO BASE UNIT
          //
          // Example:
          // 0.75 kg × 1000 = 750 g
          // ========================================

          const baseQuantity =
            quantityDecimal(
              enteredQuantity.mul(
                selectedUnit
                  .conversionFactor
              )
            );


          if (
            baseQuantity.lte(0)
          ) {
            const error =
              new Error(
                `Invalid base quantity for ${product.name}`
              );

            error.statusCode = 400;
            throw error;
          }


          // ========================================
          // INVENTORY CHECK + RESERVE
          // ========================================

          if (
            product.trackInventory
          ) {

            const inventory =
              await tx.inventory.findUnique({
                where: {
                  branchId_productId: {
                    branchId:
                      shift.branchId,

                    productId:
                      product.id,
                  },
                },
              });


            if (!inventory) {
              const error =
                new Error(
                  `Inventory not found for ${product.name} in this branch`
                );

              error.statusCode = 404;
              throw error;
            }


            const availableQuantity =
              inventory.quantity.minus(
                inventory
                  .reservedQuantity
              );


            if (
              availableQuantity.lt(
                baseQuantity
              )
            ) {
              const error =
                new Error(
                  `Insufficient stock for ${product.name}. Available: ${availableQuantity.toString()} ${product.baseUnit.symbol}`
                );

              error.statusCode = 400;
              throw error;
            }


            // Reserve inventory until payment
            await tx.inventory.update({
              where: {
                id:
                  inventory.id,
              },

              data: {
                reservedQuantity:
                  inventory
                    .reservedQuantity
                    .plus(
                      baseQuantity
                    ),
              },
            });
          }


          // ========================================
          // PRICE CALCULATION
          //
          // Example:
          //
          // Sugar:
          // baseQuantity = 750g
          // sellingUnit = kg
          // sellingUnitFactor = 1000
          // sellingPrice = 320
          //
          // 750 / 1000 = 0.75kg
          // 0.75 * 320 = 240
          // ========================================

          const sellingQuantityEquivalent =
            baseQuantity.div(
              product
                .sellingUnit
                .conversionFactor
            );


          const lineSubtotal =
            money(
              sellingQuantityEquivalent.mul(
                product.sellingPrice
              )
            );


          // Discount module comes later
          const lineDiscount =
            new Prisma.Decimal(0);


          const taxableAmount =
            lineSubtotal.minus(
              lineDiscount
            );


          const lineTax =
            money(
              taxableAmount
                .mul(
                  product.taxRate
                )
                .div(100)
            );


          const lineTotal =
            money(
              taxableAmount.plus(
                lineTax
              )
            );


          // ========================================
          // ADD TOTALS
          // ========================================

          subtotal =
            subtotal.plus(
              lineSubtotal
            );


          discountAmount =
            discountAmount.plus(
              lineDiscount
            );


          taxAmount =
            taxAmount.plus(
              lineTax
            );


          // ========================================
          // SALE ITEM SNAPSHOT
          // ========================================

          preparedItems.push({

            productId:
              product.id,

            productName:
              product.name,

            sku:
              product.sku,

            barcode:
              product.barcode,

            quantity:
              enteredQuantity,

            selectedUnitId:
              selectedUnit.id,

            selectedUnitCode:
              selectedUnit.code,

            selectedUnitSymbol:
              selectedUnit.symbol,

            selectedUnitFactor:
              selectedUnit
                .conversionFactor,

            baseQuantity,

            sellingUnitPrice:
              product.sellingPrice,

            sellingUnitFactor:
              product
                .sellingUnit
                .conversionFactor,

            lineSubtotal,

            discountAmount:
              lineDiscount,

            taxRate:
              product.taxRate,

            taxAmount:
              lineTax,

            lineTotal,

            trackInventory:
              product.trackInventory,
          });
        }


        // ============================================
        // FINAL TOTALS
        // ============================================

        subtotal =
          money(subtotal);


        discountAmount =
          money(
            discountAmount
          );


        taxAmount =
          money(
            taxAmount
          );


        const grandTotal =
          money(
            subtotal
              .minus(
                discountAmount
              )
              .plus(
                taxAmount
              )
          );


        // ============================================
        // CREATE SALE
        // ============================================

        const sale =
          await tx.sale.create({
            data: {

              saleNumber:
                generateSaleNumber(
                  shift.branch.code
                ),

              status:
                "PENDING_PAYMENT",

              // ====================================
              // HELD BILL LINK
              // ====================================

              sourceHeldBillId:
                sourceHeldBillId ||
                null,

              subtotal,

              discountAmount,

              taxAmount,

              grandTotal,

              branchId:
                shift.branchId,

              terminalId:
                shift.terminalId,

              shiftId:
                shift.id,

              cashierId:
                user.id,

              expiresAt:
                new Date(
                  Date.now() +
                    PENDING_SALE_MINUTES *
                      60 *
                      1000
                ),

              items: {
                create:
                  preparedItems,
              },
            },

            include:
              saleInclude,
          });


        return addPaymentSummary(
          sale
        );
      }
    );

  } catch (error) {

    // =================================================
    // HELD BILL DUPLICATE PROTECTION
    //
    // sourceHeldBillId has @unique.
    // If another request already created the sale,
    // return that existing sale.
    // =================================================

    if (
      sourceHeldBillId &&
      error.code === "P2002"
    ) {

      const existingSale =
        await prisma.sale.findUnique({
          where: {
            sourceHeldBillId,
          },

          include:
            saleInclude,
        });


      if (existingSale) {
        return addPaymentSummary(
          existingSale
        );
      }
    }


    throw error;
  }
};


// ======================================================
// GET ALL SALES
// ======================================================

export const getSales = async ({
  user,
  status,
  branchId,
  shiftId,
  cashierId,
  search,
  page = 1,
  limit = 20,
}) => {

  const skip =
    (page - 1) *
    limit;


  const where = {};


  // ==================================================
  // CASHIER → OWN SALES
  // ==================================================

  if (
    user.role === "CASHIER"
  ) {
    where.cashierId =
      user.id;
  }


  // ==================================================
  // MANAGER → OWN BRANCH
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
      branchId !== user.branchId
    ) {
      const error =
        new Error(
          "You cannot view sales from another branch"
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


  // ==================================================
  // FILTERS
  // ==================================================

  if (status) {
    where.status =
      status;
  }


  if (shiftId) {
    where.shiftId =
      shiftId;
  }


  if (
    cashierId &&
    user.role !== "CASHIER"
  ) {
    where.cashierId =
      cashierId;
  }


  if (search) {
    where.OR = [

      {
        saleNumber: {
          contains:
            search,

          mode:
            "insensitive",
        },
      },

      {
        invoiceNumber: {
          contains:
            search,

          mode:
            "insensitive",
        },
      },
    ];
  }


  const [
    sales,
    total,
  ] =
    await prisma.$transaction([

      prisma.sale.findMany({
        where,

        skip,

        take:
          limit,

        include: {

          cashier: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },

          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          terminal: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          sourceHeldBill: {
            select: {
              id: true,
              holdNumber: true,
              status: true,
            },
          },

          payments: {
            where: {
              status:
                "COMPLETED",
            },

            select: {
              amount:
                true,
            },
          },

          _count: {
            select: {
              items:
                true,

              payments:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),


      prisma.sale.count({
        where,
      }),
    ]);


  // ==================================================
  // PAYMENT SUMMARY
  // ==================================================

  const salesWithSummary =
    sales.map(
      (sale) => {

        const paidAmount =
          sale.payments.reduce(
            (
              totalAmount,
              payment
            ) =>
              totalAmount.plus(
                payment.amount
              ),

            new Prisma.Decimal(0)
          );


        let remainingAmount =
          sale.grandTotal.minus(
            paidAmount
          );


        if (
          remainingAmount.lt(0)
        ) {
          remainingAmount =
            new Prisma.Decimal(0);
        }


        return {
          ...sale,

          paymentSummary: {

            paidAmount:
              money(
                paidAmount
              ),

            remainingAmount:
              money(
                remainingAmount
              ),

            fullyPaid:
              remainingAmount.lte(
                0
              ),
          },
        };
      }
    );


  return {

    sales:
      salesWithSummary,

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
// GET SALE BY ID
// ======================================================

export const getSaleById = async ({
  user,
  saleId,
}) => {

  const sale =
    await prisma.sale.findUnique({
      where: {
        id:
          saleId,
      },

      include:
        saleInclude,
    });


  if (!sale) {
    const error =
      new Error(
        "Sale not found"
      );

    error.statusCode = 404;
    throw error;
  }


  validateSaleAccess(
    user,
    sale
  );


  return addPaymentSummary(
    sale
  );
};


// ======================================================
// GET SALE BY SALE NUMBER
// ======================================================

export const getSaleByNumber = async ({
  user,
  saleNumber,
}) => {

  const sale =
    await prisma.sale.findUnique({
      where: {
        saleNumber,
      },

      include:
        saleInclude,
    });


  if (!sale) {
    const error =
      new Error(
        "Sale not found"
      );

    error.statusCode = 404;
    throw error;
  }


  validateSaleAccess(
    user,
    sale
  );


  return addPaymentSummary(
    sale
  );
};


// ======================================================
// CANCEL PENDING SALE
// ======================================================

export const cancelSale = async ({
  user,
  saleId,
  reason,
}) => {

  return runSerializableTransaction(
    async (tx) => {

      const sale =
        await tx.sale.findUnique({
          where: {
            id:
              saleId,
          },

          include: {
            items:
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


      validateSaleAccess(
        user,
        sale
      );


      // ==================================================
      // PARTIALLY PAID CANNOT BE CANCELLED DIRECTLY
      // ==================================================

      if (
        sale.status !==
        "PENDING_PAYMENT"
      ) {

        const error =
          new Error(
            sale.status ===
              "PARTIALLY_PAID"

              ? "Partially paid sale cannot be cancelled directly. Refund the payment first."

              : "Only pending unpaid sales can be cancelled"
          );


        error.statusCode = 400;
        throw error;
      }


      // ==================================================
      // RELEASE RESERVED INVENTORY
      // ==================================================

      for (
        const item of sale.items
      ) {

        if (
          !item.trackInventory
        ) {
          continue;
        }


        const inventory =
          await tx.inventory.findUnique({
            where: {
              branchId_productId: {

                branchId:
                  sale.branchId,

                productId:
                  item.productId,
              },
            },
          });


        if (!inventory) {
          const error =
            new Error(
              `Inventory missing for ${item.productName}`
            );

          error.statusCode = 500;
          throw error;
        }


        const reservedAfter =
          inventory
            .reservedQuantity
            .minus(
              item.baseQuantity
            );


        // If this happens, inventory data is inconsistent.
        // Do not silently hide it.
        if (
          reservedAfter.lt(0)
        ) {
          const error =
            new Error(
              `Reserved stock inconsistency detected for ${item.productName}`
            );

          error.statusCode = 409;
          throw error;
        }


        await tx.inventory.update({
          where: {
            id:
              inventory.id,
          },

          data: {
            reservedQuantity:
              reservedAfter,
          },
        });
      }


      // ==================================================
      // CANCEL SALE
      // ==================================================

      const cancelledSale =
        await tx.sale.update({
          where: {
            id:
              sale.id,
          },

          data: {
            status:
              "CANCELLED",

            cancelledAt:
              new Date(),

            cancelReason:
              reason.trim(),

            expiresAt:
              null,
          },

          include:
            saleInclude,
        });


      return addPaymentSummary(
        cancelledSale
      );
    }
  );
};


// ======================================================
// FINALIZE SALE AFTER PAYMENT
//
// IMPORTANT:
// This is INTERNAL.
//
// Payment Service should call this function.
//
// DO NOT create:
// POST /api/sales/:id/complete
// ======================================================

export const finalizeSaleAfterPayment =
  async ({
    tx,
    saleId,
    invoiceNumber,
  }) => {

    // ==================================================
    // GET SALE
    // ==================================================

    const sale =
      await tx.sale.findUnique({
        where: {
          id:
            saleId,
        },

        include: {
          items:
            true,

          shift:
            true,

          payments: {
            where: {
              status:
                "COMPLETED",
            },

            select: {
              amount:
                true,
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


    // ==================================================
    // STATUS CHECK
    // ==================================================

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


    // ==================================================
    // SHIFT CHECK
    // ==================================================

    if (
      sale.shift.status !==
      "OPEN"
    ) {
      const error =
        new Error(
          "Cashier shift is no longer open"
        );

      error.statusCode = 400;
      throw error;
    }


    // ==================================================
    // VERIFY FULL PAYMENT
    // ==================================================

    const totalPaid =
      sale.payments.reduce(
        (
          total,
          payment
        ) =>
          total.plus(
            payment.amount
          ),

        new Prisma.Decimal(0)
      );


    if (
      totalPaid.lt(
        sale.grandTotal
      )
    ) {
      const remaining =
        sale.grandTotal.minus(
          totalPaid
        );


      const error =
        new Error(
          `Sale is not fully paid. Remaining amount: ${remaining.toFixed(2)}`
        );

      error.statusCode = 400;
      throw error;
    }


    // ==================================================
    // INVOICE NUMBER
    // ==================================================

    if (!invoiceNumber) {
      const error =
        new Error(
          "Invoice number is required to finalize sale"
        );

      error.statusCode = 500;
      throw error;
    }


    // ==================================================
    // DEDUCT INVENTORY
    // ==================================================

    for (
      const item of sale.items
    ) {

      if (
        !item.trackInventory
      ) {
        continue;
      }


      const inventory =
        await tx.inventory.findUnique({
          where: {
            branchId_productId: {

              branchId:
                sale.branchId,

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


      // ==================================================
      // RESERVED QUANTITY CHECK
      // ==================================================

      if (
        inventory
          .reservedQuantity
          .lt(
            item.baseQuantity
          )
      ) {
        const error =
          new Error(
            `Reserved inventory is invalid for ${item.productName}`
          );

        error.statusCode = 409;
        throw error;
      }


      // ==================================================
      // PHYSICAL QUANTITY CHECK
      // ==================================================

      if (
        inventory.quantity.lt(
          item.baseQuantity
        )
      ) {
        const error =
          new Error(
            `Insufficient physical stock for ${item.productName}`
          );

        error.statusCode = 409;
        throw error;
      }


      const quantityBefore =
        inventory.quantity;


      const quantityAfter =
        quantityBefore.minus(
          item.baseQuantity
        );


      const reservedAfter =
        inventory
          .reservedQuantity
          .minus(
            item.baseQuantity
          );


      // ==================================================
      // UPDATE INVENTORY
      // ==================================================

      await tx.inventory.update({
        where: {
          id:
            inventory.id,
        },

        data: {

          quantity:
            quantityAfter,

          reservedQuantity:
            reservedAfter,
        },
      });


      // ==================================================
      // STOCK MOVEMENT
      // ==================================================

      await tx.stockMovement.create({
        data: {

          movementType:
            "SALE",

          quantity:
            item.baseQuantity,

          quantityBefore,

          quantityAfter,

          reason:
            `Sale completed: ${sale.saleNumber}`,

          referenceType:
            "SALE",

          referenceId:
            sale.id,

          inventoryId:
            inventory.id,

          createdById:
            sale.cashierId,
        },
      });
    }


    // ==================================================
    // COMPLETE SALE
    // ==================================================

    const completedSale =
      await tx.sale.update({
        where: {
          id:
            sale.id,
        },

        data: {

          status:
            "COMPLETED",

          invoiceNumber,

          completedAt:
            new Date(),

          expiresAt:
            null,
        },

        include:
          saleInclude,
      });


    return addPaymentSummary(
      completedSale
    );
  };