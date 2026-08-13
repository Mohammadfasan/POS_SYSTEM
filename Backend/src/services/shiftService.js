import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ======================================
// GENERATE SHIFT NUMBER
// ======================================

const generateShiftNumber = () => {
  const now = new Date();

  const date = now
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const time = now
    .toISOString()
    .slice(11, 19)
    .replaceAll(":", "");

  const random = Math
    .floor(1000 + Math.random() * 9000);

  return `SH-${date}-${time}-${random}`;
};


// ======================================
// OPEN SHIFT
// ======================================

export const openShift = async ({
  user,
  terminalId,
  openingCash,
  openingNote,
}) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Only cashier can open a cashier shift"
    );

    error.statusCode = 403;
    throw error;
  }

  if (!user.branchId) {
    const error = new Error(
      "Cashier is not assigned to a branch"
    );

    error.statusCode = 400;
    throw error;
  }

  const amount =
    new Prisma.Decimal(openingCash);

  if (amount.lt(0)) {
    const error = new Error(
      "Opening cash cannot be negative"
    );

    error.statusCode = 400;
    throw error;
  }

  const branch =
    await prisma.branch.findUnique({
      where: {
        id: user.branchId,
      },
    });

  if (!branch) {
    const error = new Error(
      "Assigned branch not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (branch.status !== "ACTIVE") {
    const error = new Error(
      "Assigned branch is inactive"
    );

    error.statusCode = 400;
    throw error;
  }

  const terminal =
    await prisma.terminal.findUnique({
      where: {
        id: terminalId,
      },
    });

  if (!terminal) {
    const error = new Error(
      "Terminal not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (terminal.status !== "ACTIVE") {
    const error = new Error(
      "Terminal is not active"
    );

    error.statusCode = 400;
    throw error;
  }

  if (
    terminal.branchId !== user.branchId
  ) {
    const error = new Error(
      "Terminal does not belong to your branch"
    );

    error.statusCode = 403;
    throw error;
  }

  // Check cashier existing shift
  const existingCashierShift =
    await prisma.cashierShift.findFirst({
      where: {
        cashierId: user.id,
        status: "OPEN",
      },
    });

  if (existingCashierShift) {
    const error = new Error(
      "You already have an open shift"
    );

    error.statusCode = 409;
    throw error;
  }

  // Check terminal availability
  const existingTerminalShift =
    await prisma.cashierShift.findFirst({
      where: {
        terminalId,
        status: "OPEN",
      },
    });

  if (existingTerminalShift) {
    const error = new Error(
      "This terminal is already being used by another open shift"
    );

    error.statusCode = 409;
    throw error;
  }

  try {
    const shift =
      await prisma.cashierShift.create({
        data: {
          shiftNumber:
            generateShiftNumber(),

          cashierId:
            user.id,

          branchId:
            user.branchId,

          terminalId,

          openingCash:
            amount,

          expectedCash:
            amount,

          openingNote:
            openingNote?.trim() || null,

          activeCashierKey:
            user.id,

          activeTerminalKey:
            terminalId,
        },

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
        },
      });

    return shift;

  } catch (error) {

    // Handles rare concurrent shift opening
    if (error.code === "P2002") {
      const conflict =
        new Error(
          "Cashier or terminal already has an active shift"
        );

      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
};


// ======================================
// GET CURRENT CASHIER SHIFT
// ======================================

export const getCurrentShift = async (
  user
) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Current shift is available only for cashier accounts"
    );

    error.statusCode = 403;
    throw error;
  }

  return prisma.cashierShift.findFirst({
    where: {
      cashierId:
        user.id,

      status:
        "OPEN",
    },

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
          location: true,
        },
      },
    },
  });
};


// ======================================
// CLOSE SHIFT
// ======================================

export const closeShift = async ({
  user,
  shiftId,
  closingCash,
  closingNote,
}) => {
  if (user.role !== "CASHIER") {
    const error = new Error(
      "Only cashier can close their shift"
    );

    error.statusCode = 403;
    throw error;
  }

  const actualCash =
    new Prisma.Decimal(closingCash);

  if (actualCash.lt(0)) {
    const error = new Error(
      "Closing cash cannot be negative"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {

    const shift =
      await tx.cashierShift.findUnique({
        where: {
          id: shiftId,
        },
      });

    if (!shift) {
      const error = new Error(
        "Shift not found"
      );

      error.statusCode = 404;
      throw error;
    }

    if (
      shift.cashierId !== user.id
    ) {
      const error = new Error(
        "You cannot close another cashier's shift"
      );

      error.statusCode = 403;
      throw error;
    }

    if (shift.status !== "OPEN") {
      const error = new Error(
        "Shift is already closed"
      );

      error.statusCode = 400;
      throw error;
    }

    // Expected Cash:
    //
    // openingCash
    // + cashSales
    // + cashIn
    // - cashRefunds
    // - cashOut

    const expectedCash =
      shift.openingCash
        .plus(shift.cashSales)
        .plus(shift.cashIn)
        .minus(shift.cashRefunds)
        .minus(shift.cashOut);

    const cashDifference =
      actualCash.minus(
        expectedCash
      );

    // Require explanation if money differs
    if (
      !cashDifference.equals(0) &&
      !closingNote?.trim()
    ) {
      const error = new Error(
        "Closing note is required when there is a cash difference"
      );

      error.statusCode = 400;
      throw error;
    }

    return tx.cashierShift.update({
      where: {
        id: shiftId,
      },

      data: {
        status:
          "CLOSED",

        closedAt:
          new Date(),

        closingCash:
          actualCash,

        expectedCash,

        cashDifference,

        closingNote:
          closingNote?.trim() || null,

        closedById:
          user.id,

        // Release cashier and terminal
        activeCashierKey:
          null,

        activeTerminalKey:
          null,
      },

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
      },
    });
  });
};


// ======================================
// GET ALL SHIFTS
// ======================================

export const getShifts = async ({
  user,
  status,
  branchId,
  terminalId,
  cashierId,
  page = 1,
  limit = 20,
}) => {
  const skip =
    (page - 1) * limit;

  let where = {};

  // ==================================
  // CASHIER
  // Only own shifts
  // ==================================

  if (user.role === "CASHIER") {
    where.cashierId =
      user.id;
  }


  // ==================================
  // MANAGER
  // Only own branch
  // ==================================

  if (user.role === "MANAGER") {
    if (!user.branchId) {
      const error = new Error(
        "Manager is not assigned to a branch"
      );

      error.statusCode = 403;
      throw error;
    }

    if (
      branchId &&
      branchId !== user.branchId
    ) {
      const error = new Error(
        "You cannot view another branch"
      );

      error.statusCode = 403;
      throw error;
    }

    where.branchId =
      user.branchId;
  }


  // ==================================
  // ADMIN
  // Can filter any branch
  // ==================================

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

  if (terminalId) {
    where.terminalId =
      terminalId;
  }

  // Only admin/manager can filter cashier
  if (
    cashierId &&
    user.role !== "CASHIER"
  ) {
    where.cashierId =
      cashierId;
  }

  const [shifts, total] =
    await prisma.$transaction([
      prisma.cashierShift.findMany({
        where,

        skip,
        take: limit,

        include: {
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
            },
          },
        },

        orderBy: {
          openedAt:
            "desc",
        },
      }),

      prisma.cashierShift.count({
        where,
      }),
    ]);

  return {
    shifts,

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


// ======================================
// GET ONE SHIFT
// ======================================

export const getShiftById = async ({
  user,
  shiftId,
}) => {
  const shift =
    await prisma.cashierShift.findUnique({
      where: {
        id: shiftId,
      },

      include: {
        cashier: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },

        branch: true,

        terminal: true,
      },
    });

  if (!shift) {
    const error =
      new Error("Shift not found");

    error.statusCode = 404;
    throw error;
  }

  if (
    user.role === "CASHIER" &&
    shift.cashierId !== user.id
  ) {
    const error = new Error(
      "You cannot view another cashier's shift"
    );

    error.statusCode = 403;
    throw error;
  }

  if (
    user.role === "MANAGER" &&
    shift.branchId !==
      user.branchId
  ) {
    const error = new Error(
      "You cannot view another branch's shift"
    );

    error.statusCode = 403;
    throw error;
  }

  return shift;
};