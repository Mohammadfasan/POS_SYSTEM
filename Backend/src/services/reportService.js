import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ======================================================
// HELPERS
// ======================================================

const zero = () =>
  new Prisma.Decimal(0);


const money = (value) =>
  new Prisma.Decimal(value || 0)
    .toDecimalPlaces(2);


const decimalString = (value) =>
  new Prisma.Decimal(value || 0)
    .toDecimalPlaces(2)
    .toFixed(2);


// ======================================================
// DATE RANGE
// ======================================================

const buildDateRange = (
  startDate,
  endDate
) => {

  const now =
    new Date();


  let start;

  let end;


  // If no dates → today
  if (!startDate) {

    start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

  } else {

    start =
      new Date(startDate);

    start.setHours(
      0,
      0,
      0,
      0
    );
  }


  if (!endDate) {

    end =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

  } else {

    end =
      new Date(endDate);

    end.setHours(
      23,
      59,
      59,
      999
    );
  }


  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {

    const error =
      new Error(
        "Invalid date range"
      );

    error.statusCode = 400;

    throw error;
  }


  if (
    start > end
  ) {

    const error =
      new Error(
        "Start date cannot be after end date"
      );

    error.statusCode = 400;

    throw error;
  }


  return {
    start,
    end,
  };
};


// ======================================================
// ROLE / BRANCH SCOPE
// ======================================================

const getBranchScope = (
  user,
  requestedBranchId
) => {

  // ADMIN
  if (
    user.role === "ADMIN"
  ) {

    return requestedBranchId ||
      null;
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
      requestedBranchId &&
      requestedBranchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot view reports from another branch"
        );

      error.statusCode = 403;

      throw error;
    }


    return user.branchId;
  }


  // CASHIER
  if (
    user.role === "CASHIER"
  ) {

    if (!user.branchId) {

      const error =
        new Error(
          "Cashier is not assigned to a branch"
        );

      error.statusCode = 403;

      throw error;
    }


    return user.branchId;
  }


  const error =
    new Error(
      "Invalid role"
    );

  error.statusCode = 403;

  throw error;
};


// ======================================================
// SALE SCOPE
// ======================================================

const buildSaleWhere = ({
  user,
  branchId,
  start,
  end,
}) => {

  const where = {

    createdAt: {
      gte: start,
      lte: end,
    },
  };


  if (branchId) {

    where.branchId =
      branchId;
  }


  // Cashier only own sales
  if (
    user.role === "CASHIER"
  ) {

    where.cashierId =
      user.id;
  }


  return where;
};


// ======================================================
// DASHBOARD OVERVIEW
// ======================================================

export const getDashboardOverview =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const saleBaseWhere =
      buildSaleWhere({
        user,

        branchId:
          scopedBranchId,

        start,
        end,
      });


    // ==================================================
    // SALES
    //
    // Include completed and returned sales.
    // Exclude VOIDED and CANCELLED.
    // ==================================================

    const revenueStatuses = [
      "COMPLETED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
    ];


    const [
      saleAggregate,
      saleCount,
      refundAggregate,
      voidCount,
      returnCount,
      pendingSales,
    ] =
      await Promise.all([

        prisma.sale.aggregate({

          where: {
            ...saleBaseWhere,

            status: {
              in:
                revenueStatuses,
            },
          },

          _sum: {
            grandTotal:
              true,

            discountAmount:
              true,

            taxAmount:
              true,
          },
        }),


        prisma.sale.count({

          where: {
            ...saleBaseWhere,

            status: {
              in:
                revenueStatuses,
            },
          },
        }),


        prisma.refund.aggregate({

          where: {
            status:
              "COMPLETED",

            saleReturn: {

              branchId:
                scopedBranchId ||
                undefined,

              sale: {

                createdAt: {
                  gte:
                    start,

                  lte:
                    end,
                },

                ...(user.role ===
                  "CASHIER"
                  ? {
                      cashierId:
                        user.id,
                    }
                  : {}),
              },
            },
          },

          _sum: {
            amount:
              true,
          },
        }),


        prisma.voidRequest.count({

          where: {

            status:
              "COMPLETED",

            branchId:
              scopedBranchId ||
              undefined,

            completedAt: {
              gte:
                start,

              lte:
                end,
            },
          },
        }),


        prisma.saleReturn.count({

          where: {

            status:
              "COMPLETED",

            branchId:
              scopedBranchId ||
              undefined,

            completedAt: {
              gte:
                start,

              lte:
                end,
            },
          },
        }),


        prisma.sale.count({

          where: {
            ...saleBaseWhere,

            status: {
              in: [
                "PENDING_PAYMENT",
                "PARTIALLY_PAID",
              ],
            },
          },
        }),
      ]);


    const grossSales =
      money(
        saleAggregate
          ._sum
          .grandTotal ||
        0
      );


    const refunds =
      money(
        refundAggregate
          ._sum
          .amount ||
        0
      );


    const netSales =
      grossSales.minus(
        refunds
      );


    const averageSale =
      saleCount > 0
        ? netSales.div(
            saleCount
          )
        : zero();


    // ==================================================
    // PAYMENTS
    // ==================================================

    const paymentGroups =
      await prisma.payment.groupBy({

        by: [
          "method",
        ],

        where: {

          status:
            "COMPLETED",

          sale: {
            ...saleBaseWhere,

            status: {
              notIn: [
                "CANCELLED",
                "VOIDED",
              ],
            },
          },
        },

        _sum: {
          amount:
            true,
        },

        _count: {
          id:
            true,
        },
      });


    const payments =
      paymentGroups.map(
        (payment) => ({

          method:
            payment.method,

          amount:
            decimalString(
              payment._sum
                .amount ||
              0
            ),

          count:
            payment._count.id,
        })
      );


    return {

      period: {
        start,
        end,
      },


      sales: {

        grossSales:
          decimalString(
            grossSales
          ),

        refunds:
          decimalString(
            refunds
          ),

        netSales:
          decimalString(
            netSales
          ),

        totalSales:
          saleCount,

        averageSale:
          decimalString(
            averageSale
          ),

        tax:
          decimalString(
            saleAggregate
              ._sum
              .taxAmount ||
            0
          ),

        discounts:
          decimalString(
            saleAggregate
              ._sum
              .discountAmount ||
            0
          ),

        pendingSales,
      },


      returns: {
        completed:
          returnCount,
      },


      voids: {
        completed:
          voidCount,
      },


      payments,
    };
  };


// ======================================================
// SALES REPORT
// ======================================================

export const getSalesReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 50,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const where =
      buildSaleWhere({
        user,

        branchId:
          scopedBranchId,

        start,
        end,
      });


    if (status) {

      where.status =
        status;
    }


    const skip =
      (page - 1) *
      limit;


    const [
      sales,
      total,
      totals,
    ] =
      await prisma.$transaction([

        prisma.sale.findMany({

          where,

          skip,

          take:
            limit,

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

            createdAt:
              true,

            completedAt:
              true,

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


        prisma.sale.aggregate({

          where,

          _sum: {
            subtotal:
              true,

            discountAmount:
              true,

            taxAmount:
              true,

            grandTotal:
              true,
          },
        }),
      ]);


    return {

      period: {
        start,
        end,
      },


      sales,


      totals: {

        subtotal:
          decimalString(
            totals
              ._sum
              .subtotal ||
            0
          ),

        discount:
          decimalString(
            totals
              ._sum
              .discountAmount ||
            0
          ),

        tax:
          decimalString(
            totals
              ._sum
              .taxAmount ||
            0
          ),

        grandTotal:
          decimalString(
            totals
              ._sum
              .grandTotal ||
            0
          ),
      },


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
// TOP SELLING PRODUCTS
// ======================================================

export const getTopProductsReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
    limit = 10,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const saleWhere =
      buildSaleWhere({
        user,

        branchId:
          scopedBranchId,

        start,
        end,
      });


    const items =
      await prisma.saleItem.findMany({

        where: {

          sale: {

            ...saleWhere,

            status: {
              in: [
                "COMPLETED",
                "PARTIALLY_REFUNDED",
                "REFUNDED",
              ],
            },
          },
        },

        select: {

          productId:
            true,

          productName:
            true,

          sku:
            true,

          quantity:
            true,

          baseQuantity:
            true,

          lineTotal:
            true,
        },
      });


    const productMap =
      new Map();


    for (
      const item of items
    ) {

      let product =
        productMap.get(
          item.productId
        );


      if (!product) {

        product = {

          productId:
            item.productId,

          productName:
            item.productName,

          sku:
            item.sku,

          saleQuantity:
            zero(),

          baseQuantity:
            zero(),

          revenue:
            zero(),
        };


        productMap.set(
          item.productId,
          product
        );
      }


      product.saleQuantity =
        product.saleQuantity.plus(
          item.quantity
        );


      product.baseQuantity =
        product.baseQuantity.plus(
          item.baseQuantity
        );


      product.revenue =
        product.revenue.plus(
          item.lineTotal
        );
    }


    return Array
      .from(
        productMap.values()
      )
      .sort(
        (
          a,
          b
        ) =>
          b.revenue
            .minus(
              a.revenue
            )
            .toNumber()
      )
      .slice(
        0,
        limit
      )
      .map(
        (product) => ({

          productId:
            product.productId,

          productName:
            product.productName,

          sku:
            product.sku,

          saleQuantity:
            product.saleQuantity
              .toString(),

          baseQuantity:
            product.baseQuantity
              .toString(),

          revenue:
            decimalString(
              product.revenue
            ),
        })
      );
  };


// ======================================================
// PAYMENT REPORT
// ======================================================

export const getPaymentReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const saleWhere =
      buildSaleWhere({
        user,

        branchId:
          scopedBranchId,

        start,
        end,
      });


    const payments =
      await prisma.payment.groupBy({

        by: [
          "method",
        ],

        where: {

          status:
            "COMPLETED",

          sale: {

            ...saleWhere,

            status: {
              notIn: [
                "CANCELLED",
                "VOIDED",
              ],
            },
          },
        },

        _sum: {
          amount:
            true,
        },

        _count: {
          id:
            true,
        },
      });


    const refunds =
      await prisma.refund.groupBy({

        by: [
          "method",
        ],

        where: {

          status:
            "COMPLETED",

          saleReturn: {

            branchId:
              scopedBranchId ||
              undefined,

            sale: {

              createdAt: {
                gte:
                  start,

                lte:
                  end,
              },

              ...(user.role ===
                "CASHIER"
                ? {
                    cashierId:
                      user.id,
                  }
                : {}),
            },
          },
        },

        _sum: {
          amount:
            true,
        },
      });


    const methods =
      [
        "CASH",
        "CARD",
        "QR",
      ];


    return methods.map(
      (method) => {

        const payment =
          payments.find(
            (item) =>
              item.method ===
              method
          );


        const refund =
          refunds.find(
            (item) =>
              item.method ===
              method
          );


        const received =
          money(
            payment?._sum
              ?.amount ||
            0
          );


        const refunded =
          money(
            refund?._sum
              ?.amount ||
            0
          );


        return {

          method,

          transactionCount:
            payment?._count
              ?.id ||
            0,

          received:
            decimalString(
              received
            ),

          refunded:
            decimalString(
              refunded
            ),

          net:
            decimalString(
              received.minus(
                refunded
              )
            ),
        };
      }
    );
  };


// ======================================================
// INVENTORY REPORT
// ======================================================

export const getInventoryReport =
  async ({
    user,
    branchId,
    lowStockOnly = false,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const where = {};


    if (
      scopedBranchId
    ) {

      where.branchId =
        scopedBranchId;
    }


    const inventories =
      await prisma.inventory.findMany({

        where,

        include: {

          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          product: {

            include: {
              baseUnit:
                true,
            },
          },
        },

        orderBy: {

          product: {
            name:
              "asc",
          },
        },
      });


    let result =
      inventories.map(
        (inventory) => {

          const available =
            inventory.quantity.minus(
              inventory
                .reservedQuantity
            );


          const reorderLevel =
            inventory
              .product
              .reorderLevel;


          return {

            inventoryId:
              inventory.id,

            branch:
              inventory.branch,

            product: {

              id:
                inventory
                  .product
                  .id,

              sku:
                inventory
                  .product
                  .sku,

              name:
                inventory
                  .product
                  .name,

              unit:
                inventory
                  .product
                  .baseUnit
                  .symbol,
            },

            quantity:
              inventory.quantity
                .toString(),

            reservedQuantity:
              inventory
                .reservedQuantity
                .toString(),

            availableQuantity:
              available
                .toString(),

            damagedQuantity:
              inventory
                .damagedQuantity
                .toString(),

            reorderLevel:
              reorderLevel
                .toString(),

            lowStock:
              available.lte(
                reorderLevel
              ),
          };
        }
      );


    if (
      lowStockOnly
    ) {

      result =
        result.filter(
          (inventory) =>
            inventory.lowStock
        );
    }


    return {

      count:
        result.length,

      inventory:
        result,
    };
  };


// ======================================================
// CASHIER PERFORMANCE
// ======================================================

export const getCashierReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const where = {

      createdAt: {
        gte:
          start,

        lte:
          end,
      },

      status: {
        in: [
          "COMPLETED",
          "PARTIALLY_REFUNDED",
          "REFUNDED",
        ],
      },
    };


    if (
      scopedBranchId
    ) {

      where.branchId =
        scopedBranchId;
    }


    if (
      user.role ===
      "CASHIER"
    ) {

      where.cashierId =
        user.id;
    }


    const sales =
      await prisma.sale.findMany({

        where,

        select: {

          cashierId:
            true,

          grandTotal:
            true,

          cashier: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });


    const cashierMap =
      new Map();


    for (
      const sale of sales
    ) {

      let cashier =
        cashierMap.get(
          sale.cashierId
        );


      if (!cashier) {

        cashier = {

          cashier:
            sale.cashier,

          salesCount:
            0,

          salesAmount:
            zero(),
        };


        cashierMap.set(
          sale.cashierId,
          cashier
        );
      }


      cashier.salesCount++;


      cashier.salesAmount =
        cashier.salesAmount.plus(
          sale.grandTotal
        );
    }


    return Array
      .from(
        cashierMap.values()
      )
      .map(
        (cashier) => ({

          cashier:
            cashier.cashier,

          salesCount:
            cashier.salesCount,

          salesAmount:
            decimalString(
              cashier.salesAmount
            ),

          averageSale:
            cashier.salesCount > 0
              ? decimalString(
                  cashier
                    .salesAmount
                    .div(
                      cashier
                        .salesCount
                    )
                )
              : "0.00",
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          Number(
            b.salesAmount
          ) -
          Number(
            a.salesAmount
          )
      );
  };


// ======================================================
// RETURNS REPORT
// ======================================================

export const getReturnsReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const where = {

      requestedAt: {
        gte:
          start,

        lte:
          end,
      },
    };


    if (
      scopedBranchId
    ) {

      where.branchId =
        scopedBranchId;
    }


    if (
      user.role ===
      "CASHIER"
    ) {

      where.requestedById =
        user.id;
    }


    const [
      returns,
      summary,
    ] =
      await Promise.all([

        prisma.saleReturn.findMany({

          where,

          select: {

            id: true,

            returnNumber:
              true,

            status:
              true,

            refundTotal:
              true,

            requestedAt:
              true,

            completedAt:
              true,

            sale: {
              select: {
                id: true,
                saleNumber: true,
                invoiceNumber: true,
              },
            },

            requestedBy: {
              select: {
                employeeId:
                  true,

                firstName:
                  true,

                lastName:
                  true,
              },
            },
          },

          orderBy: {
            requestedAt:
              "desc",
          },
        }),


        prisma.saleReturn.aggregate({

          where: {
            ...where,

            status:
              "COMPLETED",
          },

          _sum: {
            refundTotal:
              true,
          },

          _count: {
            id:
              true,
          },
        }),
      ]);


    return {

      totalCompletedReturns:
        summary._count.id,

      totalRefundAmount:
        decimalString(
          summary
            ._sum
            .refundTotal ||
          0
        ),

      returns,
    };
  };


// ======================================================
// VOID REPORT
// ======================================================

export const getVoidReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const where = {

      requestedAt: {
        gte:
          start,

        lte:
          end,
      },
    };


    if (
      scopedBranchId
    ) {

      where.branchId =
        scopedBranchId;
    }


    if (
      user.role ===
      "CASHIER"
    ) {

      where.requestedById =
        user.id;
    }


    const voids =
      await prisma.voidRequest.findMany({

        where,

        select: {

          id: true,

          voidNumber:
            true,

          status:
            true,

          reason:
            true,

          totalAmount:
            true,

          requestedAt:
            true,

          completedAt:
            true,

          sale: {
            select: {
              id: true,
              saleNumber: true,
              invoiceNumber: true,
            },
          },

          requestedBy: {
            select: {
              employeeId:
                true,

              firstName:
                true,

              lastName:
                true,
            },
          },

          approvedBy: {
            select: {
              employeeId:
                true,

              firstName:
                true,

              lastName:
                true,
            },
          },
        },

        orderBy: {
          requestedAt:
            "desc",
        },
      });


    const completed =
      voids.filter(
        (voidRequest) =>
          voidRequest.status ===
          "COMPLETED"
      );


    const amount =
      completed.reduce(
        (
          total,
          voidRequest
        ) =>
          total.plus(
            voidRequest.totalAmount
          ),

        zero()
      );


    return {

      completedVoidCount:
        completed.length,

      completedVoidAmount:
        decimalString(
          amount
        ),

      voids,
    };
  };


// ======================================================
// DISCOUNT / PROMOTION REPORT
// ======================================================

export const getDiscountReport =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const scopedBranchId =
      getBranchScope(
        user,
        branchId
      );


    const {
      start,
      end,
    } =
      buildDateRange(
        startDate,
        endDate
      );


    const saleWhere =
      buildSaleWhere({
        user,

        branchId:
          scopedBranchId,

        start,
        end,
      });


    const [
      promotionApplications,
      manualDiscounts,
    ] =
      await Promise.all([

        prisma.salePromotion.findMany({

          where: {

            sale: {
              ...saleWhere,

              status: {
                notIn: [
                  "CANCELLED",
                  "VOIDED",
                ],
              },
            },
          },

          select: {

            promotionId:
              true,

            promotionCode:
              true,

            promotionName:
              true,

            scope:
              true,

            discountAmount:
              true,
          },
        }),


        prisma.manualDiscount.findMany({

          where: {

            status:
              "APPLIED",

            appliedAt: {
              gte:
                start,

              lte:
                end,
            },

            branchId:
              scopedBranchId ||
              undefined,

            ...(user.role ===
              "CASHIER"
              ? {
                  requestedById:
                    user.id,
                }
              : {}),
          },

          select: {

            requestNumber:
              true,

            discountType:
              true,

            value:
              true,

            appliedAmount:
              true,

            reason:
              true,

            requestedAt:
              true,

            appliedAt:
              true,
          },
        }),
      ]);


    const promotionMap =
      new Map();


    for (
      const application of
        promotionApplications
    ) {

      let promotion =
        promotionMap.get(
          application
            .promotionId
        );


      if (!promotion) {

        promotion = {

          promotionId:
            application
              .promotionId,

          code:
            application
              .promotionCode,

          name:
            application
              .promotionName,

          scope:
            application
              .scope,

          usageCount:
            0,

          discountAmount:
            zero(),
        };


        promotionMap.set(
          application
            .promotionId,
          promotion
        );
      }


      promotion.usageCount++;


      promotion.discountAmount =
        promotion.discountAmount.plus(
          application
            .discountAmount
        );
    }


    const promotions =
      Array
        .from(
          promotionMap.values()
        )
        .map(
          (promotion) => ({

            ...promotion,

            discountAmount:
              decimalString(
                promotion
                  .discountAmount
              ),
          })
        );


    const manualDiscountTotal =
      manualDiscounts.reduce(
        (
          total,
          discount
        ) =>
          total.plus(
            discount
              .appliedAmount
          ),

        zero()
      );


    return {

      promotions,

      manualDiscounts,

      summary: {

        promotionDiscountTotal:
          decimalString(
            promotionApplications
              .reduce(
                (
                  total,
                  promotion
                ) =>
                  total.plus(
                    promotion
                      .discountAmount
                  ),

                zero()
              )
          ),

        manualDiscountTotal:
          decimalString(
            manualDiscountTotal
          ),
      },
    };
  };