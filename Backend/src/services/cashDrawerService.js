import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ==========================================
// CHECK BRANCH ACCESS
// ==========================================

const validateBranchAccess = (user, branchId) => {
  if (user.role === "ADMIN") {
    return;
  }

  if (!user.branchId) {
    const error = new Error(
      "User is not assigned to a branch"
    );

    error.statusCode = 403;
    throw error;
  }

  if (user.branchId !== branchId) {
    const error = new Error(
      "You cannot access another branch"
    );

    error.statusCode = 403;
    throw error;
  }
};


// ==========================================
// CALCULATE EXPECTED CASH
// ==========================================

const calculateExpectedCash = (shift) => {
  return shift.openingCash
    .plus(shift.cashSales)
    .plus(shift.cashIn)
    .minus(shift.cashRefunds)
    .minus(shift.cashOut);
};


// ==========================================
// CREATE CASH DRAWER
// ADMIN ONLY
// ==========================================

export const createCashDrawer = async ({
  code,
  name,
  terminalId,
}) => {
  const normalizedCode = code
    .trim()
    .toUpperCase();

  const terminal =
    await prisma.terminal.findUnique({
      where: {
        id: terminalId,
      },

      include: {
        cashDrawer: true,
        branch: true,
      },
    });

  if (!terminal) {
    const error =
      new Error("Terminal not found");

    error.statusCode = 404;
    throw error;
  }

  if (terminal.status !== "ACTIVE") {
    const error = new Error(
      "Cannot assign drawer to inactive terminal"
    );

    error.statusCode = 400;
    throw error;
  }

  if (terminal.cashDrawer) {
    const error = new Error(
      "This terminal already has a cash drawer"
    );

    error.statusCode = 409;
    throw error;
  }

  const existingCode =
    await prisma.cashDrawer.findUnique({
      where: {
        code: normalizedCode,
      },
    });

  if (existingCode) {
    const error = new Error(
      "Cash drawer code already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.cashDrawer.create({
    data: {
      code: normalizedCode,
      name: name.trim(),
      terminalId,
    },

    include: {
      terminal: {
        include: {
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });
};


// ==========================================
// GET ALL DRAWERS
// ==========================================

export const getCashDrawers = async ({
  user,
  status,
}) => {
  let where = {};

  if (user.role !== "ADMIN") {
    if (!user.branchId) {
      const error = new Error(
        "User is not assigned to a branch"
      );

      error.statusCode = 403;
      throw error;
    }

    where.terminal = {
      branchId: user.branchId,
    };
  }

  if (status) {
    where.status = status;
  }

  return prisma.cashDrawer.findMany({
    where,

    include: {
      terminal: {
        include: {
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};


// ==========================================
// GET ONE DRAWER
// ==========================================

export const getCashDrawerById = async ({
  user,
  drawerId,
}) => {
  const drawer =
    await prisma.cashDrawer.findUnique({
      where: {
        id: drawerId,
      },

      include: {
        terminal: {
          include: {
            branch: true,
          },
        },
      },
    });

  if (!drawer) {
    const error =
      new Error("Cash drawer not found");

    error.statusCode = 404;
    throw error;
  }

  validateBranchAccess(
    user,
    drawer.terminal.branchId
  );

  return drawer;
};


// ==========================================
// GET CURRENT CASHIER DRAWER
// ==========================================

export const getCurrentCashDrawer = async (
  user
) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Current cash drawer is available only for cashier accounts"
    );

    error.statusCode = 403;
    throw error;
  }

  const shift =
    await prisma.cashierShift.findFirst({
      where: {
        cashierId: user.id,
        status: "OPEN",
      },

      include: {
        terminal: {
          include: {
            cashDrawer: true,
          },
        },

        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

  if (!shift) {
    const error = new Error(
      "You do not have an active shift"
    );

    error.statusCode = 400;
    throw error;
  }

  const drawer =
    shift.terminal.cashDrawer;

  if (!drawer) {
    const error = new Error(
      "No cash drawer is configured for this terminal"
    );

    error.statusCode = 404;
    throw error;
  }

  if (drawer.status !== "ACTIVE") {
    const error = new Error(
      "Cash drawer is not active"
    );

    error.statusCode = 400;
    throw error;
  }

  const expectedCash =
    calculateExpectedCash(shift);

  return {
    drawer,
    shift: {
      id: shift.id,
      shiftNumber: shift.shiftNumber,
      openedAt: shift.openedAt,
      openingCash: shift.openingCash,
      cashSales: shift.cashSales,
      cashRefunds: shift.cashRefunds,
      cashIn: shift.cashIn,
      cashOut: shift.cashOut,
      expectedCash,
    },

    terminal: {
      id: shift.terminal.id,
      code: shift.terminal.code,
      name: shift.terminal.name,
    },

    branch: shift.branch,
  };
};


// ==========================================
// CASH IN
// ==========================================

export const addCashIn = async ({
  user,
  drawerId,
  amount,
  reason,
  referenceType,
  referenceId,
}) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Only cashier can perform cash-in during a shift"
    );

    error.statusCode = 403;
    throw error;
  }

  const cashAmount =
    new Prisma.Decimal(amount);

  if (cashAmount.lte(0)) {
    const error = new Error(
      "Amount must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(
    async (tx) => {

      const drawer =
        await tx.cashDrawer.findUnique({
          where: {
            id: drawerId,
          },

          include: {
            terminal: true,
          },
        });

      if (!drawer) {
        const error = new Error(
          "Cash drawer not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (drawer.status !== "ACTIVE") {
        const error = new Error(
          "Cash drawer is not active"
        );

        error.statusCode = 400;
        throw error;
      }

      const shift =
        await tx.cashierShift.findFirst({
          where: {
            cashierId: user.id,
            status: "OPEN",
          },
        });

      if (!shift) {
        const error = new Error(
          "Open a cashier shift before cash-in"
        );

        error.statusCode = 400;
        throw error;
      }

      if (
        shift.terminalId !==
        drawer.terminalId
      ) {
        const error = new Error(
          "This drawer does not belong to your active terminal"
        );

        error.statusCode = 403;
        throw error;
      }

      const balanceBefore =
        calculateExpectedCash(shift);

      const newCashIn =
        shift.cashIn.plus(
          cashAmount
        );

      const balanceAfter =
        balanceBefore.plus(
          cashAmount
        );

      const updatedShift =
        await tx.cashierShift.update({
          where: {
            id: shift.id,
          },

          data: {
            cashIn:
              newCashIn,

            expectedCash:
              balanceAfter,
          },
        });

      const transaction =
        await tx.cashDrawerTransaction.create({
          data: {
            type: "CASH_IN",

            amount:
              cashAmount,

            balanceBefore,

            balanceAfter,

            reason:
              reason.trim(),

            referenceType:
              referenceType?.trim() ||
              null,

            referenceId:
              referenceId?.trim() ||
              null,

            drawerId:
              drawer.id,

            shiftId:
              shift.id,

            createdById:
              user.id,
          },
        });

      return {
        transaction,
        shift: updatedShift,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .Serializable,
    }
  );
};


// ==========================================
// CASH OUT
// ==========================================

export const addCashOut = async ({
  user,
  drawerId,
  amount,
  reason,
  referenceType,
  referenceId,
}) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Only cashier can perform cash-out during a shift"
    );

    error.statusCode = 403;
    throw error;
  }

  const cashAmount =
    new Prisma.Decimal(amount);

  if (cashAmount.lte(0)) {
    const error = new Error(
      "Amount must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(
    async (tx) => {

      const drawer =
        await tx.cashDrawer.findUnique({
          where: {
            id: drawerId,
          },

          include: {
            terminal: true,
          },
        });

      if (!drawer) {
        const error = new Error(
          "Cash drawer not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (drawer.status !== "ACTIVE") {
        const error = new Error(
          "Cash drawer is not active"
        );

        error.statusCode = 400;
        throw error;
      }

      const shift =
        await tx.cashierShift.findFirst({
          where: {
            cashierId: user.id,
            status: "OPEN",
          },
        });

      if (!shift) {
        const error = new Error(
          "Open a cashier shift before cash-out"
        );

        error.statusCode = 400;
        throw error;
      }

      if (
        shift.terminalId !==
        drawer.terminalId
      ) {
        const error = new Error(
          "This drawer does not belong to your active terminal"
        );

        error.statusCode = 403;
        throw error;
      }

      const balanceBefore =
        calculateExpectedCash(shift);

      if (
        balanceBefore.lt(cashAmount)
      ) {
        const error = new Error(
          `Insufficient cash in drawer. Available: ${balanceBefore.toString()}`
        );

        error.statusCode = 400;
        throw error;
      }

      const newCashOut =
        shift.cashOut.plus(
          cashAmount
        );

      const balanceAfter =
        balanceBefore.minus(
          cashAmount
        );

      const updatedShift =
        await tx.cashierShift.update({
          where: {
            id: shift.id,
          },

          data: {
            cashOut:
              newCashOut,

            expectedCash:
              balanceAfter,
          },
        });

      const transaction =
        await tx.cashDrawerTransaction.create({
          data: {
            type: "CASH_OUT",

            amount:
              cashAmount,

            balanceBefore,

            balanceAfter,

            reason:
              reason.trim(),

            referenceType:
              referenceType?.trim() ||
              null,

            referenceId:
              referenceId?.trim() ||
              null,

            drawerId:
              drawer.id,

            shiftId:
              shift.id,

            createdById:
              user.id,
          },
        });

      return {
        transaction,
        shift:
          updatedShift,
      };
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .Serializable,
    }
  );
};


// ==========================================
// CHANGE DRAWER STATUS
// ==========================================

export const changeCashDrawerStatus =
  async ({
    drawerId,
    status,
  }) => {

    const drawer =
      await prisma.cashDrawer.findUnique({
        where: {
          id: drawerId,
        },
      });

    if (!drawer) {
      const error = new Error(
        "Cash drawer not found"
      );

      error.statusCode = 404;
      throw error;
    }

    // Don't disable drawer while it has
    // an active cashier shift.
    if (status !== "ACTIVE") {

      const activeShift =
        await prisma.cashierShift.findFirst({
          where: {
            terminalId:
              drawer.terminalId,

            status:
              "OPEN",
          },
        });

      if (activeShift) {
        const error = new Error(
          "Cannot deactivate cash drawer while terminal has an open shift"
        );

        error.statusCode = 409;
        throw error;
      }
    }

    return prisma.cashDrawer.update({
      where: {
        id: drawerId,
      },

      data: {
        status,
      },
    });
  };


// ==========================================
// GET TRANSACTION HISTORY
// ==========================================

export const getCashDrawerTransactions =
  async ({
    user,
    drawerId,
    type,
    shiftId,
    page = 1,
    limit = 20,
  }) => {

    const drawer =
      await prisma.cashDrawer.findUnique({
        where: {
          id: drawerId,
        },

        include: {
          terminal: true,
        },
      });

    if (!drawer) {
      const error = new Error(
        "Cash drawer not found"
      );

      error.statusCode = 404;
      throw error;
    }

    validateBranchAccess(
      user,
      drawer.terminal.branchId
    );

    const skip =
      (page - 1) * limit;

    const where = {
      drawerId,

      ...(type && {
        type,
      }),

      ...(shiftId && {
        shiftId,
      }),
    };

    // Cashier sees only transactions
    // from their own shifts
    if (user.role === "CASHIER") {
      where.shift = {
        cashierId:
          user.id,
      };
    }

    const [transactions, total] =
      await prisma.$transaction([
        prisma.cashDrawerTransaction.findMany({
          where,

          skip,
          take: limit,

          include: {
            createdBy: {
              select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },

            shift: {
              select: {
                id: true,
                shiftNumber: true,
                cashierId: true,
                openedAt: true,
                closedAt: true,
              },
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        }),

        prisma.cashDrawerTransaction.count({
          where,
        }),
      ]);

    return {
      transactions,

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