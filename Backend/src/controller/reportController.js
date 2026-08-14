import { z } from "zod";

import {
  getDashboardOverview,
  getSalesReport,
  getTopProductsReport,
  getPaymentReport,
  getInventoryReport,
  getCashierReport,
  getReturnsReport,
  getVoidReport,
  getDiscountReport,
} from "../services/reportService.js";


// ======================================================
// COMMON QUERY
// ======================================================

const commonReportQuery =
  z.object({

    branchId:
      z.string()
        .uuid()
        .optional(),

    startDate:
      z.string()
        .optional(),

    endDate:
      z.string()
        .optional(),
  });


// ======================================================
// DASHBOARD
// ======================================================

export const getDashboardController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const dashboard =
        await getDashboardOverview({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          dashboard,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// SALES REPORT
// ======================================================

export const getSalesReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery
          .extend({

            status:
              z.enum([
                "PENDING_PAYMENT",
                "PARTIALLY_PAID",
                "COMPLETED",
                "CANCELLED",
                "VOIDED",
                "PARTIALLY_REFUNDED",
                "REFUNDED",
              ])
              .optional(),

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
                .default(50),
          })
          .parse(
            req.query
          );


      const report =
        await getSalesReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          report,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// TOP PRODUCTS
// ======================================================

export const getTopProductsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery
          .extend({

            limit:
              z.coerce
                .number()
                .int()
                .min(1)
                .max(100)
                .default(10),
          })
          .parse(
            req.query
          );


      const products =
        await getTopProductsReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          products,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// PAYMENT REPORT
// ======================================================

export const getPaymentReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const payments =
        await getPaymentReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          payments,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// INVENTORY
// ======================================================

export const getInventoryReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        z.object({

          branchId:
            z.string()
              .uuid()
              .optional(),

          lowStockOnly:
            z.enum([
              "true",
              "false",
            ])
            .optional(),
        })
        .parse(
          req.query
        );


      const report =
        await getInventoryReport({

          user:
            req.user,

          branchId:
            query.branchId,

          lowStockOnly:
            query.lowStockOnly ===
            "true",
        });


      res.status(200).json({

        success:
          true,

        data: {
          report,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// CASHIER REPORT
// ======================================================

export const getCashierReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const cashiers =
        await getCashierReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          cashiers,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// RETURN REPORT
// ======================================================

export const getReturnsReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const report =
        await getReturnsReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          report,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// VOID REPORT
// ======================================================

export const getVoidReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const report =
        await getVoidReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          report,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// DISCOUNT REPORT
// ======================================================

export const getDiscountReportController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        commonReportQuery.parse(
          req.query
        );


      const report =
        await getDiscountReport({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          report,
        },
      });

    } catch (error) {

      next(error);
    }
  };