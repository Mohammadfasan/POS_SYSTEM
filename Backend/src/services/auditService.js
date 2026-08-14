import prisma from "../config/prisma.js";

import {
  sanitizeAuditData,
} from "../utils/auditUtils.js";


// ======================================================
// DATE RANGE
// ======================================================

const buildDateRange = (
  startDate,
  endDate
) => {

  const result = {};


  if (startDate) {

    const start =
      new Date(startDate);


    start.setHours(
      0,
      0,
      0,
      0
    );


    result.gte =
      start;
  }


  if (endDate) {

    const end =
      new Date(endDate);


    end.setHours(
      23,
      59,
      59,
      999
    );


    result.lte =
      end;
  }


  return Object.keys(
    result
  ).length
    ? result
    : undefined;
};


// ======================================================
// AUDIT ACCESS
//
// ADMIN
// → all logs
//
// MANAGER
// → own branch logs
//
// Cashier does not receive Audit Log management access.
// ======================================================

const buildAuditAccessWhere = (
  user,
  requestedBranchId
) => {

  if (
    user.role === "ADMIN"
  ) {

    return requestedBranchId
      ? {
          branchId:
            requestedBranchId,
        }
      : {};
  }


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
          "You cannot access another branch's audit logs"
        );

      error.statusCode = 403;

      throw error;
    }


    return {
      branchId:
        user.branchId,
    };
  }


  const error =
    new Error(
      "You do not have permission to view audit logs"
    );

  error.statusCode = 403;

  throw error;
};


// ======================================================
// GET ACTOR SNAPSHOT
// ======================================================

const resolveActor = async ({
  db,
  actor,
  actorId,
}) => {

  if (actor) {

    return {

      id:
        actor.id ||
        null,

      employeeId:
        actor.employeeId ||
        null,

      name:
        [
          actor.firstName,
          actor.lastName,
        ]
          .filter(Boolean)
          .join(" ") ||
        null,

      role:
        actor.role ||
        null,

      branchId:
        actor.branchId ||
        null,
    };
  }


  if (!actorId) {

    return {
      id: null,
      employeeId: null,
      name: null,
      role: null,
      branchId: null,
    };
  }


  const dbUser =
    await db.user.findUnique({

      where: {
        id:
          actorId,
      },

      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        role: true,
        branchId: true,
      },
    });


  if (!dbUser) {

    return {
      id:
        null,

      employeeId:
        null,

      name:
        null,

      role:
        null,

      branchId:
        null,
    };
  }


  return {

    id:
      dbUser.id,

    employeeId:
      dbUser.employeeId,

    name:
      `${dbUser.firstName} ${dbUser.lastName}`,

    role:
      dbUser.role,

    branchId:
      dbUser.branchId,
  };
};


// ======================================================
// CREATE AUDIT LOG
//
// db can be:
//
// prisma
//
// OR
//
// tx
//
// This is important for financial / stock operations.
// ======================================================

export const createAuditLog = async ({
  db = prisma,

  actor = null,
  actorId = null,

  branchId = null,

  module,
  action,

  entityType,
  entityId = null,

  description,

  severity = "INFO",

  beforeData = undefined,
  afterData = undefined,
  metadata = undefined,

  request = {},
}) => {

  if (!module) {

    throw new Error(
      "Audit module is required"
    );
  }


  if (!action) {

    throw new Error(
      "Audit action is required"
    );
  }


  if (!entityType) {

    throw new Error(
      "Audit entity type is required"
    );
  }


  if (!description) {

    throw new Error(
      "Audit description is required"
    );
  }


  const actorSnapshot =
    await resolveActor({

      db,

      actor,

      actorId,
    });


  const safeBefore =
    sanitizeAuditData(
      beforeData
    );


  const safeAfter =
    sanitizeAuditData(
      afterData
    );


  const safeMetadata =
    sanitizeAuditData(
      metadata
    );


  return db.auditLog.create({

    data: {

      requestId:
        request.requestId ||
        null,


      actorId:
        actorSnapshot.id,

      actorEmployeeId:
        actorSnapshot.employeeId,

      actorName:
        actorSnapshot.name,

      actorRole:
        actorSnapshot.role,


      branchId:
        branchId ||
        actorSnapshot.branchId ||
        null,


      module,

      action,

      entityType,

      entityId,

      severity,

      description,


      ...(safeBefore !==
      undefined
        ? {
            beforeData:
              safeBefore,
          }
        : {}),


      ...(safeAfter !==
      undefined
        ? {
            afterData:
              safeAfter,
          }
        : {}),


      ...(safeMetadata !==
      undefined
        ? {
            metadata:
              safeMetadata,
          }
        : {}),


      ipAddress:
        request.ipAddress ||
        null,

      userAgent:
        request.userAgent ||
        null,

      httpMethod:
        request.httpMethod ||
        null,

      path:
        request.path ||
        null,
    },
  });
};


// ======================================================
// SAFE AUDIT LOG
//
// Useful for events where audit failure should not
// crash the request.
//
// Example:
// LOGIN_FAILED
// ======================================================

export const createAuditLogSafe =
  async (data) => {

    try {

      return await createAuditLog(
        data
      );

    } catch (error) {

      console.error(
        "Audit log creation failed:",
        error
      );

      return null;
    }
  };


// ======================================================
// GET AUDIT LOGS
// ======================================================

export const getAuditLogs = async ({
  user,

  branchId,
  actorId,

  module,
  action,
  severity,

  entityType,
  entityId,

  requestId,

  search,

  startDate,
  endDate,

  page = 1,
  limit = 50,
}) => {

  const accessWhere =
    buildAuditAccessWhere(
      user,
      branchId
    );


  const where = {
    ...accessWhere,
  };


  if (actorId) {

    where.actorId =
      actorId;
  }


  if (module) {

    where.module =
      module;
  }


  if (action) {

    where.action =
      action;
  }


  if (severity) {

    where.severity =
      severity;
  }


  if (entityType) {

    where.entityType =
      entityType;
  }


  if (entityId) {

    where.entityId =
      entityId;
  }


  if (requestId) {

    where.requestId =
      requestId;
  }


  const createdAt =
    buildDateRange(
      startDate,
      endDate
    );


  if (createdAt) {

    where.createdAt =
      createdAt;
  }


  if (search) {

    where.AND = [
      {
        OR: [
          {
            action: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            module: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            description: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            actorEmployeeId: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            actorName: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            entityType: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },

          {
            entityId: {
              contains:
                search,

              mode:
                "insensitive",
            },
          },
        ],
      },
    ];
  }


  const skip =
    (page - 1) *
    limit;


  const [
    logs,
    total,
  ] =
    await prisma.$transaction([

      prisma.auditLog.findMany({

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
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),


      prisma.auditLog.count({
        where,
      }),
    ]);


  return {

    logs,

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

export const getAuditLogById =
  async ({
    user,
    auditId,
  }) => {

    const auditLog =
      await prisma.auditLog.findUnique({

        where: {
          id:
            auditId,
        },

        include: {

          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });


    if (!auditLog) {

      const error =
        new Error(
          "Audit log not found"
        );

      error.statusCode = 404;

      throw error;
    }


    if (
      user.role === "ADMIN"
    ) {

      return auditLog;
    }


    if (
      user.role === "MANAGER"
    ) {

      if (
        !user.branchId ||
        auditLog.branchId !==
          user.branchId
      ) {

        const error =
          new Error(
            "You cannot access this audit log"
          );

        error.statusCode = 403;

        throw error;
      }


      return auditLog;
    }


    const error =
      new Error(
        "You do not have permission to view audit logs"
      );

    error.statusCode = 403;

    throw error;
  };


// ======================================================
// GET ENTITY HISTORY
//
// Example:
//
// Product → all updates
//
// Sale → create/payment/void/refund
// ======================================================

export const getEntityAuditHistory =
  async ({
    user,
    entityType,
    entityId,
    page = 1,
    limit = 50,
  }) => {

    const accessWhere =
      buildAuditAccessWhere(
        user
      );


    const where = {

      ...accessWhere,

      entityType,

      entityId,
    };


    const skip =
      (page - 1) *
      limit;


    const [
      logs,
      total,
    ] =
      await prisma.$transaction([

        prisma.auditLog.findMany({

          where,

          skip,

          take:
            limit,

          orderBy: {
            createdAt:
              "desc",
          },
        }),


        prisma.auditLog.count({
          where,
        }),
      ]);


    return {

      logs,

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
// AUDIT SUMMARY
// ======================================================

export const getAuditSummary =
  async ({
    user,
    branchId,
    startDate,
    endDate,
  }) => {

    const accessWhere =
      buildAuditAccessWhere(
        user,
        branchId
      );


    const where = {
      ...accessWhere,
    };


    const createdAt =
      buildDateRange(
        startDate,
        endDate
      );


    if (createdAt) {

      where.createdAt =
        createdAt;
    }


    const [
      total,
      critical,
      warnings,
      moduleGroups,
      actionGroups,
    ] =
      await Promise.all([

        prisma.auditLog.count({
          where,
        }),


        prisma.auditLog.count({

          where: {
            ...where,

            severity:
              "CRITICAL",
          },
        }),


        prisma.auditLog.count({

          where: {
            ...where,

            severity:
              "WARNING",
          },
        }),


        prisma.auditLog.groupBy({

          by: [
            "module",
          ],

          where,

          _count: {
            id:
              true,
          },

          orderBy: {
            _count: {
              id:
                "desc",
            },
          },
        }),


        prisma.auditLog.groupBy({

          by: [
            "action",
          ],

          where,

          _count: {
            id:
              true,
          },

          orderBy: {
            _count: {
              id:
                "desc",
            },
          },

          take:
            20,
        }),
      ]);


    return {

      totalLogs:
        total,

      criticalLogs:
        critical,

      warningLogs:
        warnings,

      infoLogs:
        Math.max(
          total -
            critical -
            warnings,
          0
        ),


      byModule:
        moduleGroups.map(
          (item) => ({

            module:
              item.module,

            count:
              item._count.id,
          })
        ),


      topActions:
        actionGroups.map(
          (item) => ({

            action:
              item.action,

            count:
              item._count.id,
          })
        ),
    };
  };