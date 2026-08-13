import prisma from "../../config/prisma.js";

// Create branch
export const createBranch = async (data) => {
  const code = data.code.trim().toUpperCase();

  const existingBranch = await prisma.branch.findUnique({
    where: { code },
  });

  if (existingBranch) {
    const error = new Error("Branch code already exists");
    error.statusCode = 409;
    throw error;
  }

  const branch = await prisma.branch.create({
    data: {
      code,
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email
        ? data.email.trim().toLowerCase()
        : null,
      address: data.address || null,
      city: data.city || null,
    },
  });

  return branch;
};

// Get all branches
export const getAllBranches = async () => {
  return prisma.branch.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
};

// Get one branch
export const getBranchById = async (branchId) => {
  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!branch) {
    const error = new Error("Branch not found");
    error.statusCode = 404;
    throw error;
  }

  return branch;
};

// Update branch
export const updateBranch = async (
  branchId,
  data
) => {
  const existingBranch =
    await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
    });

  if (!existingBranch) {
    const error = new Error("Branch not found");
    error.statusCode = 404;
    throw error;
  }

  let code;

  if (data.code) {
    code = data.code.trim().toUpperCase();

    const duplicateBranch =
      await prisma.branch.findFirst({
        where: {
          code,
          NOT: {
            id: branchId,
          },
        },
      });

    if (duplicateBranch) {
      const error = new Error(
        "Branch code already exists"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.branch.update({
    where: {
      id: branchId,
    },

    data: {
      ...(code && { code }),

      ...(data.name && {
        name: data.name.trim(),
      }),

      ...(data.phone !== undefined && {
        phone: data.phone || null,
      }),

      ...(data.email !== undefined && {
        email: data.email
          ? data.email.trim().toLowerCase()
          : null,
      }),

      ...(data.address !== undefined && {
        address: data.address || null,
      }),

      ...(data.city !== undefined && {
        city: data.city || null,
      }),
    },
  });
};

// Change branch status
export const changeBranchStatus = async (
  branchId,
  status
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

  return prisma.branch.update({
    where: {
      id: branchId,
    },
    data: {
      status,
    },
  });
};

// Assign Manager/Cashier to branch
export const assignUserToBranch = async (
  branchId,
  userId
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

  if (branch.status !== "ACTIVE") {
    const error = new Error(
      "Cannot assign user to inactive branch"
    );
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "ADMIN") {
    const error = new Error(
      "Admin does not need branch assignment"
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      branchId,
    },

    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      branchId: true,

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

// Remove user from branch
export const removeUserFromBranch = async (
  userId
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      branchId: null,
    },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      branchId: true,
    },
  });
};

// Get users of a branch
export const getBranchUsers = async (
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

  return prisma.user.findMany({
    where: {
      branchId,
    },

    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
    },

    orderBy: {
      firstName: "asc",
    },
  });
};