import prisma from "../../config/prisma.js";

// ========================================
// CREATE TERMINAL
// ========================================
export const createTerminal = async ({
  code,
  name,
  location,
  branchId,
}) => {
  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
  });

  if (!branch) {
    const error = new Error("Branch not found");
    error.statusCode = 404;
    throw error;
  }

  if (branch.status !== "ACTIVE") {
    const error = new Error(
      "Cannot create terminal for inactive branch"
    );
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.trim().toUpperCase();

  const existingTerminal =
    await prisma.terminal.findUnique({
      where: {
        branchId_code: {
          branchId,
          code: normalizedCode,
        },
      },
    });

  if (existingTerminal) {
    const error = new Error(
      "Terminal code already exists in this branch"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.terminal.create({
    data: {
      code: normalizedCode,
      name: name.trim(),
      location: location?.trim() || null,
      branchId,
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
};

// ========================================
// GET ALL TERMINALS
// ========================================
export const getAllTerminals = async () => {
  return prisma.terminal.findMany({
    include: {
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// GET ONE TERMINAL
// ========================================
export const getTerminalById = async (
  terminalId
) => {
  const terminal =
    await prisma.terminal.findUnique({
      where: {
        id: terminalId,
      },

      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    });

  if (!terminal) {
    const error = new Error("Terminal not found");
    error.statusCode = 404;
    throw error;
  }

  return terminal;
};

// ========================================
// GET TERMINALS BY BRANCH
// ========================================
export const getTerminalsByBranch = async (
  branchId
) => {
  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
  });

  if (!branch) {
    const error = new Error("Branch not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.terminal.findMany({
    where: {
      branchId,
    },

    orderBy: {
      code: "asc",
    },
  });
};

// ========================================
// UPDATE TERMINAL
// ========================================
export const updateTerminal = async (
  terminalId,
  data
) => {
  const terminal =
    await prisma.terminal.findUnique({
      where: {
        id: terminalId,
      },
    });

  if (!terminal) {
    const error = new Error("Terminal not found");
    error.statusCode = 404;
    throw error;
  }

  let normalizedCode;

  if (data.code) {
    normalizedCode = data.code
      .trim()
      .toUpperCase();

    const duplicate =
      await prisma.terminal.findFirst({
        where: {
          branchId: terminal.branchId,
          code: normalizedCode,

          NOT: {
            id: terminalId,
          },
        },
      });

    if (duplicate) {
      const error = new Error(
        "Terminal code already exists in this branch"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.terminal.update({
    where: {
      id: terminalId,
    },

    data: {
      ...(normalizedCode && {
        code: normalizedCode,
      }),

      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.location !== undefined && {
        location:
          data.location?.trim() || null,
      }),
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
};

// ========================================
// CHANGE TERMINAL STATUS
// ========================================
export const changeTerminalStatus = async (
  terminalId,
  status
) => {
  const terminal =
    await prisma.terminal.findUnique({
      where: {
        id: terminalId,
      },
    });

  if (!terminal) {
    const error = new Error("Terminal not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.terminal.update({
    where: {
      id: terminalId,
    },

    data: {
      status,
    },
  });
};