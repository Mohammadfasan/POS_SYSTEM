import { z } from "zod";

import {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditHistory,
  getAuditSummary,
} from "../services/auditService.js";


// ======================================================
// QUERY VALIDATION
// ======================================================

const auditQuerySchema =
  z.object({

    branchId:
      z.string()
        .uuid()
        .optional(),

    actorId:
      z.string()
        .uuid()
        .optional(),

    module:
      z.string()
        .trim()
        .max(100)
        .optional(),

    action:
      z.string()
        .trim()
        .max(100)
        .optional(),

    severity:
      z.enum([
        "INFO",
        "WARNING",
        "CRITICAL",
      ])
      .optional(),

    entityType:
      z.string()
        .trim()
        .max(100)
        .optional(),

    entityId:
      z.string()
        .trim()
        .max(150)
        .optional(),

    requestId:
      z.string()
        .trim()
        .max(150)
        .optional(),

    search:
      z.string()
        .trim()
        .max(150)
        .optional(),

    startDate:
      z.string()
        .optional(),

    endDate:
      z.string()
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
  });


// ======================================================
// GET ALL
// ======================================================

export const getAuditLogsController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const query =
        auditQuerySchema.parse(
          req.query
        );


      const result =
        await getAuditLogs({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// GET ONE
// ======================================================

export const getAuditLogController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const auditId =
        z.string()
          .uuid(
            "Invalid audit log ID"
          )
          .parse(
            req.params.id
          );


      const auditLog =
        await getAuditLogById({

          user:
            req.user,

          auditId,
        });


      res.status(200).json({

        success:
          true,

        data: {
          auditLog,
        },
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// ENTITY HISTORY
// ======================================================

export const getEntityAuditHistoryController =
  async (
    req,
    res,
    next
  ) => {

    try {

      const params =
        z.object({

          entityType:
            z.string()
              .trim()
              .min(1)
              .max(100),

          entityId:
            z.string()
              .trim()
              .min(1)
              .max(150),
        })
        .parse(
          req.params
        );


      const query =
        z.object({

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


      const result =
        await getEntityAuditHistory({

          user:
            req.user,

          entityType:
            params.entityType,

          entityId:
            params.entityId,

          page:
            query.page,

          limit:
            query.limit,
        });


      res.status(200).json({

        success:
          true,

        data:
          result,
      });

    } catch (error) {

      next(error);
    }
  };


// ======================================================
// SUMMARY
// ======================================================

export const getAuditSummaryController =
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

          startDate:
            z.string()
              .optional(),

          endDate:
            z.string()
              .optional(),
        })
        .parse(
          req.query
        );


      const summary =
        await getAuditSummary({

          user:
            req.user,

          ...query,
        });


      res.status(200).json({

        success:
          true,

        data: {
          summary,
        },
      });

    } catch (error) {

      next(error);
    }
  };