import prisma from "../config/prisma.js";


export const getStockMovements = async ({
  user,
  branchId,
  productId,
  movementType,
  page = 1,
  limit = 20,
}) => {
  let selectedBranchId = branchId;

  if (user.role !== "ADMIN") {
    if (!user.branchId) {
      const error = new Error(
        "User is not assigned to a branch"
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

    selectedBranchId = user.branchId;
  }

  const skip =
    (page - 1) * limit;

  const where = {
    ...(movementType && {
      movementType,
    }),

    inventory: {
      ...(selectedBranchId && {
        branchId: selectedBranchId,
      }),

      ...(productId && {
        productId,
      }),
    },
  };

  const [movements, total] =
    await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,

        skip,
        take: limit,

        include: {
          inventory: {
            include: {
              branch: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },

              product: {
                select: {
                  id: true,
                  sku: true,
                  barcode: true,
                  name: true,

                  baseUnit: {
                    select: {
                      name: true,
                      symbol: true,
                    },
                  },
                },
              },
            },
          },

          createdBy: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.stockMovement.count({
        where,
      }),
    ]);

  return {
    movements,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(total / limit),
    },
  };
};