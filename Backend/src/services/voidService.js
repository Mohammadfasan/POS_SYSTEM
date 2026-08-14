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

const money = (value) => {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(2);
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
// NUMBER GENERATORS
// ======================================================

const generateVoidNumber = (
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


  return `VOID-${branchCode}-${date}-${random}`;
};


const generateVoidRefundNumber = () => {

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


  return `VREF-${date}-${random}`;
};


// ======================================================
// EXPECTED CASH
// ======================================================

const calculateExpectedCash = (
  shift
) => {

  return new Prisma.Decimal(
    shift.openingCash
  )
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


// ======================================================
// VOID INCLUDE
// ======================================================

const voidInclude = {

  branch: {

    select: {

      id: true,

      code:
        true,

      name:
        true,
    },
  },


  sale: {

    include: {

      items: {

        orderBy: {
          createdAt:
            "asc",
        },
      },


      payments: {

        where: {
          status:
            "COMPLETED",
        },

        orderBy: {
          createdAt:
            "asc",
        },

        select: {

          id: true,

          paymentNumber:
            true,

          method:
            true,

          amount:
            true,

          transactionReference:
            true,

          createdAt:
            true,


          voidRefunds: {

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
      },
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


  approvedBy: {

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


  completedBy: {

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


  refunds: {

    orderBy: {
      createdAt:
        "asc",
    },

    include: {

      payment: {

        select: {

          id: true,

          paymentNumber:
            true,

          method:
            true,

          amount:
            true,
        },
      },


      processedBy: {

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


      drawer: {

        select: {

          id: true,

          code:
            true,

          name:
            true,
        },
      },
    },
  },
};


// ======================================================
// VOID ACCESS
// ======================================================

const validateVoidAccess = (
  user,
  voidRequest
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
      voidRequest.branchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot access void requests from another branch"
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
      voidRequest.requestedById !==
      user.id
    ) {

      const error =
        new Error(
          "You cannot access another cashier's void request"
        );

      error.statusCode = 403;

      throw error;
    }


    return;
  }


  const error =
    new Error(
      "You do not have permission to access this void request"
    );

  error.statusCode = 403;

  throw error;
};


// ======================================================
// APPROVAL ACCESS
// ======================================================

const validateApprovalAccess = (
  user,
  voidRequest
) => {

  if (
    user.role === "ADMIN"
  ) {

    return;
  }


  if (
    user.role !==
    "MANAGER"
  ) {

    const error =
      new Error(
        "Only Manager or Admin can approve or reject void requests"
      );

    error.statusCode = 403;

    throw error;
  }


  if (
    !user.branchId ||
    user.branchId !==
      voidRequest.branchId
  ) {

    const error =
      new Error(
        "You cannot manage another branch's void request"
      );

    error.statusCode = 403;

    throw error;
  }
};


// ======================================================
// RETURN CONFLICT
//
// A sale with active/completed Return cannot later be
// completely VOIDED because it could duplicate:
//
// refund
// inventory restoration
//
// ======================================================

const checkReturnConflict = async (
  db,
  saleId
) => {

  const conflictingReturn =
    await db.saleReturn.findFirst({

      where: {

        saleId,

        status: {

          in: [
            "PENDING",
            "APPROVED",
            "PROCESSING",
            "COMPLETED",
          ],
        },
      },

      select: {

        id: true,

        returnNumber:
          true,

        status:
          true,
      },
    });


  if (conflictingReturn) {

    const error =
      new Error(
        `Sale has an active or completed return (${conflictingReturn.returnNumber}). It cannot be voided.`
      );

    error.statusCode = 400;

    throw error;
  }
};


// ======================================================
// CREATE VOID REQUEST
// ======================================================

export const createVoidRequest = async ({
  user,
  saleId,
  reason,
  auditContext = {},
}) => {

  // ==================================================
  // CASHIER ONLY
  // ==================================================

  if (
    user.role !== "CASHIER"
  ) {

    const error =
      new Error(
        "Only cashier can create a void request"
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
            "You can only request void for your own sale"
          );

        error.statusCode = 403;

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
      // SALE STATUS
      // ============================================

      if (
        sale.status !==
        "COMPLETED"
      ) {

        const error =
          new Error(
            "Only completed sales can be voided"
          );

        error.statusCode = 400;

        throw error;
      }


      // ============================================
      // RETURN CONFLICT
      // ============================================

      await checkReturnConflict(
        tx,
        sale.id
      );


      // ============================================
      // EXISTING ACTIVE VOID
      // ============================================

      const existingVoid =
        await tx.voidRequest.findFirst({

          where: {

            saleId:
              sale.id,

            status: {

              in: [
                "PENDING",
                "APPROVED",
                "PROCESSING",
                "COMPLETED",
              ],
            },
          },
        });


      if (existingVoid) {

        const error =
          new Error(
            `A void request already exists for this sale: ${existingVoid.voidNumber}`
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // CREATE VOID
      // ============================================

      const voidRequest =
        await tx.voidRequest.create({

          data: {

            voidNumber:
              generateVoidNumber(
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


            reason:
              reason.trim(),


            totalAmount:
              sale.grandTotal,
          },

          include:
            voidInclude,
        });


      // ============================================
      // AUDIT
      // VOID_REQUESTED
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          sale.branchId,


        module:
          AUDIT_MODULES.VOID,


        action:
          AUDIT_ACTIONS
            .VOID_REQUESTED,


        entityType:
          "VOID_REQUEST",


        entityId:
          voidRequest.id,


        description:
          `Void ${voidRequest.voidNumber} requested for sale ${sale.saleNumber}`,


        severity:
          "WARNING",


        afterData: {

          voidNumber:
            voidRequest.voidNumber,

          status:
            "PENDING",

          saleId:
            sale.id,

          saleNumber:
            sale.saleNumber,

          amount:
            sale.grandTotal,

          reason:
            reason.trim(),
        },


        metadata: {

          invoiceNumber:
            sale.invoiceNumber,

          cashierId:
            sale.cashierId,

          branchId:
            sale.branchId,

          terminalId:
            sale.terminalId,

          shiftId:
            sale.shiftId,
        },


        request:
          auditContext,
      });


      return voidRequest;
    }
  );
};


// ======================================================
// GET VOID REQUESTS
// ======================================================

export const getVoidRequests = async ({
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


  // ==================================================
  // FILTERS
  // ==================================================

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
        voidNumber: {

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
    requests,
    total,
  ] =
    await prisma.$transaction([

      prisma.voidRequest.findMany({

        where,

        skip,

        take:
          limit,

        include: {

          sale: {

            select: {

              id: true,

              saleNumber:
                true,

              invoiceNumber:
                true,

              status:
                true,

              grandTotal:
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


          approvedBy: {

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


          _count: {

            select: {

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


      prisma.voidRequest.count({
        where,
      }),
    ]);


  return {

    requests,


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
// GET VOID BY ID
// ======================================================

export const getVoidRequestById = async ({
  user,
  voidId,
}) => {

  const voidRequest =
    await prisma.voidRequest.findUnique({

      where: {
        id:
          voidId,
      },

      include:
        voidInclude,
    });


  if (!voidRequest) {

    const error =
      new Error(
        "Void request not found"
      );

    error.statusCode = 404;

    throw error;
  }


  validateVoidAccess(
    user,
    voidRequest
  );


  return voidRequest;
};


// ======================================================
// GET VOID BY NUMBER
// ======================================================

export const getVoidRequestByNumber = async ({
  user,
  voidNumber,
}) => {

  const voidRequest =
    await prisma.voidRequest.findUnique({

      where: {
        voidNumber,
      },

      include:
        voidInclude,
    });


  if (!voidRequest) {

    const error =
      new Error(
        "Void request not found"
      );

    error.statusCode = 404;

    throw error;
  }


  validateVoidAccess(
    user,
    voidRequest
  );


  return voidRequest;
};


// ======================================================
// APPROVE VOID
// ======================================================

export const approveVoidRequest = async ({
  user,
  voidId,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      const voidRequest =
        await tx.voidRequest.findUnique({

          where: {
            id:
              voidId,
          },

          include: {

            sale:
              true,
          },
        });


      if (!voidRequest) {

        const error =
          new Error(
            "Void request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      validateApprovalAccess(
        user,
        voidRequest
      );


      if (
        voidRequest.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending void requests can be approved"
          );

        error.statusCode = 400;

        throw error;
      }


      if (
        voidRequest.sale.status !==
        "COMPLETED"
      ) {

        const error =
          new Error(
            "Sale is no longer eligible for void"
          );

        error.statusCode = 400;

        throw error;
      }


      await checkReturnConflict(
        tx,
        voidRequest.saleId
      );


      const approvedAt =
        new Date();


      const result =
        await tx.voidRequest.updateMany({

          where: {

            id:
              voidId,

            status:
              "PENDING",
          },

          data: {

            status:
              "APPROVED",

            approvedById:
              user.id,

            approvedAt,
          },
        });


      if (
        result.count !== 1
      ) {

        const error =
          new Error(
            "Void request status changed while approving"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // VOID_APPROVED
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          voidRequest.branchId,


        module:
          AUDIT_MODULES.VOID,


        action:
          AUDIT_ACTIONS
            .VOID_APPROVED,


        entityType:
          "VOID_REQUEST",


        entityId:
          voidRequest.id,


        description:
          `Void ${voidRequest.voidNumber} approved`,


        severity:
          "WARNING",


        beforeData: {

          status:
            "PENDING",
        },


        afterData: {

          status:
            "APPROVED",

          approvedById:
            user.id,

          approvedAt,
        },


        metadata: {

          saleId:
            voidRequest.saleId,

          saleNumber:
            voidRequest
              .sale
              .saleNumber,

          amount:
            voidRequest.totalAmount,

          reason:
            voidRequest.reason,
        },


        request:
          auditContext,
      });
    }
  );


  return getVoidRequestById({
    user,
    voidId,
  });
};


// ======================================================
// REJECT VOID
// ======================================================

export const rejectVoidRequest = async ({
  user,
  voidId,
  reason,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      const voidRequest =
        await tx.voidRequest.findUnique({

          where: {
            id:
              voidId,
          },
        });


      if (!voidRequest) {

        const error =
          new Error(
            "Void request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      validateApprovalAccess(
        user,
        voidRequest
      );


      if (
        voidRequest.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending void requests can be rejected"
          );

        error.statusCode = 400;

        throw error;
      }


      const rejectedAt =
        new Date();


      const result =
        await tx.voidRequest.updateMany({

          where: {

            id:
              voidId,

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
            "Void request status changed while rejecting"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // VOID_REJECTED
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          voidRequest.branchId,


        module:
          AUDIT_MODULES.VOID,


        action:
          AUDIT_ACTIONS
            .VOID_REJECTED,


        entityType:
          "VOID_REQUEST",


        entityId:
          voidRequest.id,


        description:
          `Void ${voidRequest.voidNumber} rejected`,


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
            voidRequest.saleId,

          amount:
            voidRequest.totalAmount,

          originalReason:
            voidRequest.reason,
        },


        request:
          auditContext,
      });
    }
  );


  return getVoidRequestById({
    user,
    voidId,
  });
};


// ======================================================
// CANCEL VOID
// ======================================================

export const cancelVoidRequest = async ({
  user,
  voidId,
  reason,
  auditContext = {},
}) => {

  await runSerializableTransaction(
    async (tx) => {

      const voidRequest =
        await tx.voidRequest.findUnique({

          where: {
            id:
              voidId,
          },
        });


      if (!voidRequest) {

        const error =
          new Error(
            "Void request not found"
          );

        error.statusCode = 404;

        throw error;
      }


      validateVoidAccess(
        user,
        voidRequest
      );


      if (
        voidRequest.status !==
        "PENDING"
      ) {

        const error =
          new Error(
            "Only pending void requests can be cancelled"
          );

        error.statusCode = 400;

        throw error;
      }


      const cancelledAt =
        new Date();


      const result =
        await tx.voidRequest.updateMany({

          where: {

            id:
              voidId,

            status:
              "PENDING",
          },

          data: {

            status:
              "CANCELLED",

            cancelledById:
              user.id,

            cancelledAt,

            cancelReason:
              reason.trim(),
          },
        });


      if (
        result.count !== 1
      ) {

        const error =
          new Error(
            "Void request status changed while cancelling"
          );

        error.statusCode = 409;

        throw error;
      }


      // ============================================
      // AUDIT
      // VOID_CANCELLED
      // ============================================

      await createAuditLog({

        db:
          tx,


        actor:
          user,


        branchId:
          voidRequest.branchId,


        module:
          AUDIT_MODULES.VOID,


        action:
          AUDIT_ACTIONS
            .VOID_CANCELLED,


        entityType:
          "VOID_REQUEST",


        entityId:
          voidRequest.id,


        description:
          `Void ${voidRequest.voidNumber} cancelled`,


        severity:
          "WARNING",


        beforeData: {

          status:
            "PENDING",
        },


        afterData: {

          status:
            "CANCELLED",

          cancelReason:
            reason.trim(),

          cancelledAt,
        },


        metadata: {

          saleId:
            voidRequest.saleId,

          amount:
            voidRequest.totalAmount,
        },


        request:
          auditContext,
      });
    }
  );


  return getVoidRequestById({
    user,
    voidId,
  });
};


// ======================================================
// EXECUTE VOID
// ======================================================

export const executeVoidRequest = async ({
  user,
  voidId,
  refundReferences = [],
  idempotencyKey,
  auditContext = {},
}) => {

  // ==================================================
  // CASHIER ONLY
  // ==================================================

  if (
    user.role !== "CASHIER"
  ) {

    const error =
      new Error(
        "Only cashier can execute an approved void"
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


  // ==================================================
  // IDEMPOTENCY KEY
  // ==================================================

  if (
    !idempotencyKey ||
    !String(
      idempotencyKey
    ).trim()
  ) {

    const error =
      new Error(
        "Idempotency-Key header is required"
      );

    error.statusCode = 400;

    throw error;
  }


  const normalizedIdempotencyKey =
    String(
      idempotencyKey
    ).trim();


  // ==================================================
  // CHECK KEY USED BY ANOTHER VOID
  // ==================================================

  const keyOwner =
    await prisma.voidRequest.findUnique({

      where: {

        executionIdempotencyKey:
          normalizedIdempotencyKey,
      },

      include:
        voidInclude,
    });


  if (keyOwner) {

    if (
      keyOwner.id !==
      voidId
    ) {

      const error =
        new Error(
          "Idempotency key has already been used by another void request"
        );

      error.statusCode = 409;

      throw error;
    }


    if (
      keyOwner.status ===
      "COMPLETED"
    ) {

      return {

        voidRequest:
          keyOwner,

        duplicateRequest:
          true,
      };
    }
  }


  // ==================================================
  // CURRENT VOID
  // ==================================================

  const existingRequest =
    await prisma.voidRequest.findUnique({

      where: {
        id:
          voidId,
      },

      include:
        voidInclude,
    });


  if (!existingRequest) {

    const error =
      new Error(
        "Void request not found"
      );

    error.statusCode = 404;

    throw error;
  }


  if (
    existingRequest.status ===
      "COMPLETED" &&
    existingRequest
      .executionIdempotencyKey ===
      normalizedIdempotencyKey
  ) {

    return {

      voidRequest:
        existingRequest,

      duplicateRequest:
        true,
    };
  }


  // ==================================================
  // EXECUTE TRANSACTION
  // ==================================================

  try {

    return await runSerializableTransaction(
      async (tx) => {

        // ============================================
        // GET VOID
        // ============================================

        const voidRequest =
          await tx.voidRequest.findUnique({

            where: {
              id:
                voidId,
            },

            include: {

              sale: {

                include: {

                  items:
                    true,


                  payments: {

                    where: {
                      status:
                        "COMPLETED",
                    },

                    orderBy: {
                      createdAt:
                        "asc",
                    },
                  },
                },
              },
            },
          });


        if (!voidRequest) {

          const error =
            new Error(
              "Void request not found"
            );

          error.statusCode = 404;

          throw error;
        }


        // ============================================
        // BRANCH
        // ============================================

        if (
          voidRequest.branchId !==
          user.branchId
        ) {

          const error =
            new Error(
              "Void belongs to another branch"
            );

          error.statusCode = 403;

          throw error;
        }


        // ============================================
        // APPROVED
        // ============================================

        if (
          voidRequest.status !==
          "APPROVED"
        ) {

          const error =
            new Error(
              "Void request must be approved first"
            );

          error.statusCode = 400;

          throw error;
        }


        // ============================================
        // SALE
        // ============================================

        if (
          voidRequest.sale.status !==
          "COMPLETED"
        ) {

          const error =
            new Error(
              "Sale is no longer eligible for void"
            );

          error.statusCode = 400;

          throw error;
        }


        // ============================================
        // RETURN CONFLICT
        // ============================================

        await checkReturnConflict(
          tx,
          voidRequest.saleId
        );


        // ============================================
        // CLAIM
        // ============================================

        const claimed =
          await tx.voidRequest.updateMany({

            where: {

              id:
                voidRequest.id,

              status:
                "APPROVED",
            },

            data: {

              status:
                "PROCESSING",

              executionIdempotencyKey:
                normalizedIdempotencyKey,
            },
          });


        if (
          claimed.count !==
          1
        ) {

          const error =
            new Error(
              "Void request is already being processed"
            );

          error.statusCode = 409;

          throw error;
        }


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
              "Open a cashier shift before executing a void"
            );

          error.statusCode = 400;

          throw error;
        }


        if (
          shift.branchId !==
          voidRequest.branchId
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


        // ============================================
        // REFUND REFERENCE MAP
        //
        // CARD and QR require an external reference.
        // CASH does not.
        // ============================================

        const referenceMap =
          new Map();


        for (
          const reference of
            refundReferences
        ) {

          if (
            referenceMap.has(
              reference.paymentId
            )
          ) {

            const error =
              new Error(
                "Duplicate refund reference for the same payment"
              );

            error.statusCode = 400;

            throw error;
          }


          referenceMap.set(
            reference.paymentId,

            reference
              .transactionReference
          );
        }


        // ============================================
        // CALCULATE REFUND
        // ============================================

        const refundPayments =
          [];


        let totalRefund =
          zero();


        let totalCashRefund =
          zero();


        for (
          const payment of
            voidRequest
              .sale
              .payments
        ) {

          // ==========================================
          // NORMAL RETURN REFUNDS
          // ==========================================

          const returnRefundResult =
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


          // ==========================================
          // EXISTING VOID REFUNDS
          // ==========================================

          const voidRefundResult =
            await tx.voidRefund.aggregate({

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


          const previousReturnRefund =
            returnRefundResult
              ._sum
              .amount ??
            zero();


          const previousVoidRefund =
            voidRefundResult
              ._sum
              .amount ??
            zero();


          const alreadyRefunded =
            previousReturnRefund.plus(
              previousVoidRefund
            );


          const refundableAmount =
            payment.amount.minus(
              alreadyRefunded
            );


          if (
            refundableAmount.lt(0)
          ) {

            const error =
              new Error(
                `Invalid refund history for payment ${payment.paymentNumber}`
              );

            error.statusCode = 409;

            throw error;
          }


          if (
            refundableAmount.eq(0)
          ) {

            continue;
          }


          // ==========================================
          // CARD / QR REFERENCE
          // ==========================================

          let transactionReference =
            null;


          if (
            [
              "CARD",
              "QR",
            ].includes(
              payment.method
            )
          ) {

            transactionReference =
              referenceMap.get(
                payment.id
              );


            if (
              !transactionReference
                ?.trim()
            ) {

              const error =
                new Error(
                  `Void refund reference is required for ${payment.method} payment ${payment.paymentNumber}`
                );

              error.statusCode = 400;

              throw error;
            }


            transactionReference =
              transactionReference
                .trim();
          }


          refundPayments.push({

            payment,

            amount:
              money(
                refundableAmount
              ),

            transactionReference,
          });


          totalRefund =
            totalRefund.plus(
              refundableAmount
            );


          if (
            payment.method ===
            "CASH"
          ) {

            totalCashRefund =
              totalCashRefund.plus(
                refundableAmount
              );
          }
        }


        totalRefund =
          money(
            totalRefund
          );


        totalCashRefund =
          money(
            totalCashRefund
          );


        // ============================================
        // FULL REVERSAL REQUIRED
        // ============================================

        if (
          !totalRefund.eq(
            voidRequest
              .sale
              .grandTotal
          )
        ) {

          const error =
            new Error(
              `Full void requires refunding the complete sale amount ${voidRequest.sale.grandTotal.toFixed(2)}. Refundable amount is ${totalRefund.toFixed(2)}.`
            );

          error.statusCode = 400;

          throw error;
        }


        // ============================================
        // CASH DRAWER
        // ============================================

        const drawer =
          shift
            .terminal
            .cashDrawer;


        let runningCashBalance =
          calculateExpectedCash(
            shift
          );


        const cashBefore =
          runningCashBalance;


        if (
          totalCashRefund.gt(0)
        ) {

          if (!drawer) {

            const error =
              new Error(
                "No cash drawer configured for the active terminal"
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
              runningCashBalance
            )
          ) {

            const error =
              new Error(
                `Insufficient expected cash for void. Available: ${runningCashBalance.toFixed(2)}`
              );

            error.statusCode = 400;

            throw error;
          }
        }


        // ============================================
        // CREATE VOID REFUNDS
        // ============================================

        const createdRefunds =
          [];


        for (
          const refundData of
            refundPayments
        ) {

          const voidRefund =
            await tx.voidRefund.create({

              data: {

                refundNumber:
                  generateVoidRefundNumber(),


                status:
                  "COMPLETED",


                method:
                  refundData
                    .payment
                    .method,


                amount:
                  refundData.amount,


                transactionReference:
                  refundData
                    .transactionReference,


                note:
                  `Void ${voidRequest.voidNumber}`,


                voidRequestId:
                  voidRequest.id,


                paymentId:
                  refundData
                    .payment
                    .id,


                shiftId:
                  shift.id,


                processedById:
                  user.id,


                drawerId:
                  refundData
                    .payment
                    .method ===
                    "CASH"
                    ? drawer.id
                    : null,
              },
            });


          createdRefunds.push(
            voidRefund
          );


          // ==========================================
          // CASH REFUND
          // ==========================================

          if (
            refundData
              .payment
              .method ===
            "CASH"
          ) {

            const balanceBefore =
              runningCashBalance;


            const balanceAfter =
              balanceBefore.minus(
                refundData.amount
              );


            await tx
              .cashDrawerTransaction
              .create({

                data: {

                  type:
                    "VOID",


                  amount:
                    refundData.amount,


                  balanceBefore,


                  balanceAfter,


                  reason:
                    `Void ${voidRequest.voidNumber}`,


                  referenceType:
                    "VOID_REFUND",


                  referenceId:
                    voidRefund.id,


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


        // ============================================
        // SHIFT CASH REFUND
        // ============================================

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


        // ============================================
        // RESTORE INVENTORY
        // ============================================

        const inventoryChanges =
          [];


        for (
          const item of
            voidRequest
              .sale
              .items
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
                    voidRequest.branchId,

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


          // ==========================================
          // INVENTORY UPDATE
          // ==========================================

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


          // ==========================================
          // STOCK MOVEMENT
          // ==========================================

          await tx.stockMovement.create({

            data: {

              movementType:
                "VOID",


              quantity:
                item.baseQuantity,


              quantityBefore,


              quantityAfter,


              reason:
                `Void sale ${voidRequest.sale.saleNumber}`,


              referenceType:
                "VOID",


              referenceId:
                voidRequest.id,


              inventoryId:
                inventory.id,


              createdById:
                user.id,
            },
          });


          inventoryChanges.push({

            inventoryId:
              inventory.id,

            productId:
              item.productId,

            productName:
              item.productName,

            sku:
              item.sku,

            restoredQuantity:
              item.baseQuantity,

            quantityBefore,

            quantityAfter,
          });
        }


        // ============================================
        // SALE -> VOIDED
        // ============================================

        await tx.sale.update({

          where: {
            id:
              voidRequest.saleId,
          },

          data: {

            status:
              "VOIDED",
          },
        });


        // ============================================
        // VOID -> COMPLETED
        // ============================================

        const completedAt =
          new Date();


        await tx.voidRequest.update({

          where: {
            id:
              voidRequest.id,
          },

          data: {

            status:
              "COMPLETED",

            completedById:
              user.id,

            completedAt,
          },
        });


        // ============================================
        // AUDIT
        // VOID_COMPLETED
        //
        // CRITICAL because:
        // - money reversed
        // - inventory restored
        // - completed financial sale changed to VOIDED
        // ============================================

        await createAuditLog({

          db:
            tx,


          actor:
            user,


          branchId:
            voidRequest.branchId,


          module:
            AUDIT_MODULES.VOID,


          action:
            AUDIT_ACTIONS
              .VOID_COMPLETED,


          entityType:
            "VOID_REQUEST",


          entityId:
            voidRequest.id,


          description:
            `Sale ${voidRequest.sale.saleNumber} voided through ${voidRequest.voidNumber}`,


          severity:
            "CRITICAL",


          beforeData: {

            voidStatus:
              "APPROVED",

            saleStatus:
              "COMPLETED",

            saleAmount:
              voidRequest
                .sale
                .grandTotal,

            expectedCash:
              cashBefore,
          },


          afterData: {

            voidStatus:
              "COMPLETED",

            saleStatus:
              "VOIDED",

            totalRefund,

            cashRefund:
              totalCashRefund,

            expectedCash:
              runningCashBalance,

            completedAt,
          },


          metadata: {

            voidNumber:
              voidRequest.voidNumber,

            saleId:
              voidRequest.saleId,

            saleNumber:
              voidRequest
                .sale
                .saleNumber,

            invoiceNumber:
              voidRequest
                .sale
                .invoiceNumber,

            reason:
              voidRequest.reason,

            idempotencyKey:
              normalizedIdempotencyKey,

            executionShiftId:
              shift.id,

            executionTerminalId:
              shift.terminalId,

            originalSaleShiftId:
              voidRequest
                .sale
                .shiftId,

            originalSaleTerminalId:
              voidRequest
                .sale
                .terminalId,


            refundCount:
              createdRefunds.length,


            refunds:
              createdRefunds.map(
                (refund) => ({

                  refundId:
                    refund.id,

                  refundNumber:
                    refund.refundNumber,

                  paymentId:
                    refund.paymentId,

                  method:
                    refund.method,

                  amount:
                    refund.amount,

                  transactionReference:
                    refund
                      .transactionReference,
                })
              ),


            inventoryRestored:
              inventoryChanges.length >
              0,

            inventoryChanges,
          },


          request:
            auditContext,
        });


        // ============================================
        // FINAL RESULT
        // ============================================

        const completedVoid =
          await tx.voidRequest.findUnique({

            where: {
              id:
                voidRequest.id,
            },

            include:
              voidInclude,
          });


        return {

          voidRequest:
            completedVoid,

          duplicateRequest:
            false,
        };
      }
    );

  } catch (error) {

    // =================================================
    // IDEMPOTENCY UNIQUE CONFLICT
    // =================================================

    if (
      error.code ===
      "P2002"
    ) {

      const existing =
        await prisma.voidRequest.findUnique({

          where: {

            executionIdempotencyKey:
              normalizedIdempotencyKey,
          },

          include:
            voidInclude,
        });


      if (
        existing &&
        existing.id ===
          voidId &&
        existing.status ===
          "COMPLETED"
      ) {

        return {

          voidRequest:
            existing,

          duplicateRequest:
            true,
        };
      }
    }


    throw error;
  }
};