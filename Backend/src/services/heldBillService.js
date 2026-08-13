import crypto from "crypto";
import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";

import {
  createSale,
  getSaleById,
} from "./saleService.js";


const DEFAULT_HOLD_MINUTES = 60;


// ======================================================
// DECIMAL
// ======================================================

const quantityDecimal = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(3);
};


// ======================================================
// GENERATE HOLD NUMBER
// ======================================================

const generateHoldNumber = (
  branchCode
) => {

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

  return `HOLD-${branchCode}-${date}-${random}`;
};


// ======================================================
// INCLUDE
// ======================================================

const heldBillInclude = {

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

  shift: {
    select: {
      id: true,
      shiftNumber: true,
      status: true,
      openedAt: true,
    },
  },

  cashier: {
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

  resumedSale: {
    select: {
      id: true,
      saleNumber: true,
      invoiceNumber: true,
      status: true,
      grandTotal: true,
      createdAt: true,
    },
  },
};


// ======================================================
// ACCESS VALIDATION
// ======================================================

const validateHeldBillAccess = (
  user,
  heldBill
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

    if (
      !user.branchId ||
      heldBill.branchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot access held bills from another branch"
        );

      error.statusCode = 403;

      throw error;
    }

    return;
  }


  // CASHIER
  if (
    user.role === "CASHIER" &&
    heldBill.cashierId !==
      user.id
  ) {

    const error =
      new Error(
        "You cannot access another cashier's held bill"
      );

    error.statusCode = 403;

    throw error;
  }
};


// ======================================================
// MARK EXPIRED HELD BILLS
// ======================================================

const expireOldHeldBills =
  async () => {

    await prisma.heldBill.updateMany({

      where: {
        status:
          "HELD",

        expiresAt: {
          lte:
            new Date(),
        },
      },

      data: {
        status:
          "EXPIRED",
      },
    });
  };


// ======================================================
// CREATE HELD BILL
// ======================================================

export const createHeldBill =
  async ({
    user,
    items,
    note,
    expiresInMinutes,
  }) => {

    if (
      user.role !== "CASHIER"
    ) {

      const error =
        new Error(
          "Only cashier can hold a bill"
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
          "Held bill must contain at least one item"
        );

      error.statusCode = 400;

      throw error;
    }


    return prisma.$transaction(
      async (tx) => {

        // ============================================
        // ACTIVE SHIFT
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

              terminal:
                true,
            },
          });


        if (!shift) {

          const error =
            new Error(
              "Open a cashier shift before holding a bill"
            );

          error.statusCode = 403;

          throw error;
        }


        if (
          shift.branchId !==
          user.branchId
        ) {

          const error =
            new Error(
              "Cashier shift branch is invalid"
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


        // ============================================
        // DUPLICATE PRODUCT + UNIT
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
                "Duplicate product/unit lines found. Combine the quantities."
              );

            error.statusCode = 400;

            throw error;
          }


          itemKeys.add(
            key
          );
        }


        // ============================================
        // PREPARE ITEMS
        // ============================================

        const preparedItems =
          [];


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
                "Quantity must be greater than zero"
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
          // UNIT
          // ========================================

          const unit =
            await tx.unit.findUnique({

              where: {
                id:
                  item.unitId,
              },
            });


          if (!unit) {

            const error =
              new Error(
                `Unit not found for ${product.name}`
              );

            error.statusCode = 404;

            throw error;
          }


          if (
            unit.status !==
            "ACTIVE"
          ) {

            const error =
              new Error(
                `${unit.name} is inactive`
              );

            error.statusCode = 400;

            throw error;
          }


          if (
            unit.measurementType !==
            product.baseUnit.measurementType
          ) {

            const error =
              new Error(
                `Invalid unit for ${product.name}`
              );

            error.statusCode = 400;

            throw error;
          }


          // ========================================
          // FRACTIONAL QUANTITY
          // ========================================

          if (
            !product.allowFractionalQuantity &&
            !enteredQuantity.isInteger()
          ) {

            const error =
              new Error(
                `${product.name} must use whole quantities`
              );

            error.statusCode = 400;

            throw error;
          }


          // ========================================
          // CURRENT STOCK CHECK
          //
          // Important:
          // We only CHECK stock.
          // We DO NOT reserve it.
          // ========================================

          const baseQuantity =
            quantityDecimal(
              enteredQuantity.mul(
                unit.conversionFactor
              )
            );


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
                  `Inventory not found for ${product.name}`
                );

              error.statusCode = 404;

              throw error;
            }


            const available =
              inventory.quantity.minus(
                inventory.reservedQuantity
              );


            if (
              available.lt(
                baseQuantity
              )
            ) {

              const error =
                new Error(
                  `Insufficient stock for ${product.name}. Available: ${available.toString()} ${product.baseUnit.symbol}`
                );

              error.statusCode = 400;

              throw error;
            }
          }


          // ========================================
          // SNAPSHOT
          // ========================================

          preparedItems.push({

            productId:
              product.id,

            unitId:
              unit.id,

            productName:
              product.name,

            sku:
              product.sku,

            barcode:
              product.barcode,

            quantity:
              enteredQuantity,

            unitCode:
              unit.code,

            unitSymbol:
              unit.symbol,

            unitFactor:
              unit.conversionFactor,
          });
        }


        // ============================================
        // EXPIRY
        // ============================================

        const minutes =
          Number(
            expiresInMinutes ||
            DEFAULT_HOLD_MINUTES
          );


        const expiresAt =
          new Date(
            Date.now() +
              minutes *
                60 *
                1000
          );


        // ============================================
        // CREATE
        // ============================================

        return tx.heldBill.create({

          data: {

            holdNumber:
              generateHoldNumber(
                shift.branch.code
              ),

            status:
              "HELD",

            note:
              note?.trim() ||
              null,

            branchId:
              shift.branchId,

            terminalId:
              shift.terminalId,

            shiftId:
              shift.id,

            cashierId:
              user.id,

            expiresAt,

            items: {
              create:
                preparedItems,
            },
          },

          include:
            heldBillInclude,
        });
      }
    );
  };


// ======================================================
// GET HELD BILLS
// ======================================================

export const getHeldBills =
  async ({
    user,
    status,
    branchId,
    shiftId,
    search,
    page = 1,
    limit = 20,
  }) => {

    await expireOldHeldBills();


    const skip =
      (page - 1) *
      limit;


    const where = {};


    // CASHIER → own only
    if (
      user.role === "CASHIER"
    ) {

      where.cashierId =
        user.id;
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
        branchId &&
        branchId !==
          user.branchId
      ) {

        const error =
          new Error(
            "You cannot view another branch"
          );

        error.statusCode = 403;

        throw error;
      }


      where.branchId =
        user.branchId;
    }


    // ADMIN
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


    if (shiftId) {

      where.shiftId =
        shiftId;
    }


    if (search) {

      where.OR = [

        {
          holdNumber: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },

        {
          note: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
      ];
    }


    const [
      heldBills,
      total,
    ] =
      await prisma.$transaction([

        prisma.heldBill.findMany({

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

            terminal: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },

            cashier: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
              },
            },

            resumedSale: {
              select: {
                id: true,
                saleNumber: true,
                status: true,
              },
            },

            _count: {
              select: {
                items:
                  true,
              },
            },
          },

          orderBy: {
            heldAt:
              "desc",
          },
        }),


        prisma.heldBill.count({
          where,
        }),
      ]);


    return {

      heldBills,

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

export const getHeldBillById =
  async ({
    user,
    heldBillId,
  }) => {

    await expireOldHeldBills();


    const heldBill =
      await prisma.heldBill.findUnique({

        where: {
          id:
            heldBillId,
        },

        include:
          heldBillInclude,
      });


    if (!heldBill) {

      const error =
        new Error(
          "Held bill not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateHeldBillAccess(
      user,
      heldBill
    );


    return heldBill;
  };


// ======================================================
// GET BY HOLD NUMBER
// ======================================================

export const getHeldBillByNumber =
  async ({
    user,
    holdNumber,
  }) => {

    await expireOldHeldBills();


    const heldBill =
      await prisma.heldBill.findUnique({

        where: {
          holdNumber,
        },

        include:
          heldBillInclude,
      });


    if (!heldBill) {

      const error =
        new Error(
          "Held bill not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateHeldBillAccess(
      user,
      heldBill
    );


    return heldBill;
  };


// ======================================================
// CANCEL HELD BILL
// ======================================================

export const cancelHeldBill =
  async ({
    user,
    heldBillId,
    reason,
  }) => {

    await expireOldHeldBills();


    const heldBill =
      await prisma.heldBill.findUnique({

        where: {
          id:
            heldBillId,
        },
      });


    if (!heldBill) {

      const error =
        new Error(
          "Held bill not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateHeldBillAccess(
      user,
      heldBill
    );


    if (
      heldBill.status !==
      "HELD"
    ) {

      const error =
        new Error(
          "Only active held bills can be cancelled"
        );

      error.statusCode = 400;

      throw error;
    }


    return prisma.heldBill.update({

      where: {
        id:
          heldBill.id,
      },

      data: {

        status:
          "CANCELLED",

        cancelledAt:
          new Date(),

        cancelReason:
          reason.trim(),
      },

      include:
        heldBillInclude,
    });
  };


// ======================================================
// RESUME HELD BILL
//
// Creates normal PENDING_PAYMENT Sale
// ======================================================

export const resumeHeldBill =
  async ({
    user,
    heldBillId,
  }) => {

    if (
      user.role !== "CASHIER"
    ) {

      const error =
        new Error(
          "Only cashier can resume a held bill"
        );

      error.statusCode = 403;

      throw error;
    }


    await expireOldHeldBills();


    let heldBill =
      await prisma.heldBill.findUnique({

        where: {
          id:
            heldBillId,
        },

        include: {
          items:
            true,

          resumedSale:
            true,
        },
      });


    if (!heldBill) {

      const error =
        new Error(
          "Held bill not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validateHeldBillAccess(
      user,
      heldBill
    );


    // ========================================
    // ALREADY HAS SALE
    // ========================================

    const existingSale =
      await prisma.sale.findUnique({

        where: {
          sourceHeldBillId:
            heldBill.id,
        },
      });


    if (existingSale) {

      if (
        heldBill.status !==
        "RESUMED"
      ) {

        await prisma.heldBill.update({

          where: {
            id:
              heldBill.id,
          },

          data: {
            status:
              "RESUMED",

            resumedAt:
              heldBill.resumedAt ||
              new Date(),
          },
        });
      }


      const sale =
        await getSaleById({

          user,

          saleId:
            existingSale.id,
        });


      return {

        heldBillId:
          heldBill.id,

        holdNumber:
          heldBill.holdNumber,

        sale,

        alreadyResumed:
          true,
      };
    }


    if (
      heldBill.status ===
      "EXPIRED"
    ) {

      const error =
        new Error(
          "Held bill has expired"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      heldBill.status ===
      "CANCELLED"
    ) {

      const error =
        new Error(
          "Cancelled held bill cannot be resumed"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      heldBill.status ===
      "RESUMED"
    ) {

      const error =
        new Error(
          "Held bill has already been resumed"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      heldBill.status ===
      "RESUMING"
    ) {

      const error =
        new Error(
          "Held bill is currently being resumed"
        );

      error.statusCode = 409;

      throw error;
    }


    // ========================================
    // ATOMIC CLAIM
    // ========================================

    const claimed =
      await prisma.heldBill.updateMany({

        where: {

          id:
            heldBill.id,

          status:
            "HELD",
        },

        data: {
          status:
            "RESUMING",
        },
      });


    if (
      claimed.count !== 1
    ) {

      const error =
        new Error(
          "Held bill is already being processed"
        );

      error.statusCode = 409;

      throw error;
    }


    try {

      // ======================================
      // CONVERT ITEMS TO NORMAL SALE INPUT
      // ======================================

      const saleItems =
        heldBill.items.map(
          (item) => ({

            productId:
              item.productId,

            unitId:
              item.unitId,

            quantity:
              item.quantity.toString(),
          })
        );


      // ======================================
      // CREATE SALE
      //
      // createSale will:
      //
      // recheck current product
      // recheck current price
      // recheck current stock
      // reserve stock
      // create PENDING_PAYMENT Sale
      // ======================================

      const sale =
        await createSale({

          user,

          items:
            saleItems,

          sourceHeldBillId:
            heldBill.id,
        });


      // ======================================
      // MARK HELD BILL RESUMED
      // ======================================

      await prisma.heldBill.update({

        where: {
          id:
            heldBill.id,
        },

        data: {

          status:
            "RESUMED",

          resumedAt:
            new Date(),
        },
      });


      return {

        heldBillId:
          heldBill.id,

        holdNumber:
          heldBill.holdNumber,

        sale,

        alreadyResumed:
          false,
      };

    } catch (error) {

      // ======================================
      // SAFETY CHECK
      //
      // createSale may already exist.
      // ======================================

      const linkedSale =
        await prisma.sale.findUnique({

          where: {
            sourceHeldBillId:
              heldBill.id,
          },
        });


      if (linkedSale) {

        await prisma.heldBill.update({

          where: {
            id:
              heldBill.id,
          },

          data: {

            status:
              "RESUMED",

            resumedAt:
              new Date(),
          },
        });


        const sale =
          await getSaleById({

            user,

            saleId:
              linkedSale.id,
          });


        return {

          heldBillId:
            heldBill.id,

          holdNumber:
            heldBill.holdNumber,

          sale,

          alreadyResumed:
            true,
        };
      }


      // Sale creation failed completely.
      // Return bill to HELD.

      await prisma.heldBill.updateMany({

        where: {

          id:
            heldBill.id,

          status:
            "RESUMING",
        },

        data: {
          status:
            "HELD",
        },
      });


      throw error;
    }
  };