import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";


// ==========================================
// CHECK BRANCH ACCESS
// ==========================================

const validateBranchAccess = (user, branchId) => {
  // Admin can access any branch
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
// VALIDATE BRANCH + PRODUCT
// ==========================================

const validateInventoryReferences = async (
  tx,
  branchId,
  productId
) => {
  const [branch, product] = await Promise.all([
    tx.branch.findUnique({
      where: {
        id: branchId,
      },
    }),

    tx.product.findUnique({
      where: {
        id: productId,
      },

      include: {
        baseUnit: true,
      },
    }),
  ]);

  if (!branch) {
    const error = new Error("Branch not found");
    error.statusCode = 404;
    throw error;
  }

  if (branch.status !== "ACTIVE") {
    const error = new Error(
      "Branch is not active"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (product.status !== "ACTIVE") {
    const error = new Error(
      "Product is not active"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!product.trackInventory) {
    const error = new Error(
      "Inventory tracking is disabled for this product"
    );

    error.statusCode = 400;
    throw error;
  }

  return {
    branch,
    product,
  };
};


// ==========================================
// STOCK IN
// ==========================================

export const stockIn = async ({
  user,
  branchId,
  productId,
  quantity,
  movementType,
  reason,
  referenceType,
  referenceId,
}) => {
  validateBranchAccess(user, branchId);

  const amount = new Prisma.Decimal(quantity);

  if (amount.lte(0)) {
    const error = new Error(
      "Quantity must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }

  const allowedTypes = [
    "OPENING_STOCK",
    "PURCHASE",
    "ADJUSTMENT_IN",
    "RETURN",
    "VOID",
    "TRANSFER_IN",
  ];

  if (!allowedTypes.includes(movementType)) {
    const error = new Error(
      "Invalid stock-in movement type"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const { product } =
      await validateInventoryReferences(
        tx,
        branchId,
        productId
      );

    let inventory = await tx.inventory.upsert({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },

      update: {},

      create: {
        branchId,
        productId,
        quantity: 0,
      },
    });

    const quantityBefore =
      inventory.quantity;

    const quantityAfter =
      quantityBefore.plus(amount);

    inventory = await tx.inventory.update({
      where: {
        id: inventory.id,
      },

      data: {
        quantity: quantityAfter,
      },

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
            baseUnit: true,
            sellingUnit: true,
          },
        },
      },
    });

    const movement =
      await tx.stockMovement.create({
        data: {
          movementType,

          quantity: amount,

          quantityBefore,
          quantityAfter,

          reason: reason?.trim() || null,

          referenceType:
            referenceType?.trim() || null,

          referenceId:
            referenceId?.trim() || null,

          inventoryId: inventory.id,

          createdById: user.id,
        },
      });

    return {
      inventory,
      movement,

      baseUnit: product.baseUnit,
    };
  });
};


// ==========================================
// STOCK OUT
// ==========================================

export const stockOut = async ({
  user,
  branchId,
  productId,
  quantity,
  movementType,
  reason,
  referenceType,
  referenceId,
}) => {
  validateBranchAccess(user, branchId);

  const amount = new Prisma.Decimal(quantity);

  if (amount.lte(0)) {
    const error = new Error(
      "Quantity must be greater than zero"
    );

    error.statusCode = 400;
    throw error;
  }

  const allowedTypes = [
    "ADJUSTMENT_OUT",
    "DAMAGED",
    "EXPIRED",
    "SALE",
    "TRANSFER_OUT",
  ];

  if (!allowedTypes.includes(movementType)) {
    const error = new Error(
      "Invalid stock-out movement type"
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    await validateInventoryReferences(
      tx,
      branchId,
      productId
    );

    const inventory =
      await tx.inventory.findUnique({
        where: {
          branchId_productId: {
            branchId,
            productId,
          },
        },
      });

    if (!inventory) {
      const error = new Error(
        "Inventory record not found"
      );

      error.statusCode = 404;
      throw error;
    }

    const availableQuantity =
      inventory.quantity.minus(
        inventory.reservedQuantity
      );

    if (availableQuantity.lt(amount)) {
      const error = new Error(
        `Insufficient stock. Available quantity: ${availableQuantity.toString()}`
      );

      error.statusCode = 400;
      throw error;
    }

    const quantityBefore =
      inventory.quantity;

    const quantityAfter =
      quantityBefore.minus(amount);

    let damagedQuantity =
      inventory.damagedQuantity;

    if (movementType === "DAMAGED") {
      damagedQuantity =
        damagedQuantity.plus(amount);
    }

    const updatedInventory =
      await tx.inventory.update({
        where: {
          id: inventory.id,
        },

        data: {
          quantity: quantityAfter,
          damagedQuantity,
        },

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
              baseUnit: true,
              sellingUnit: true,
            },
          },
        },
      });

    const movement =
      await tx.stockMovement.create({
        data: {
          movementType,

          quantity: amount,

          quantityBefore,
          quantityAfter,

          reason: reason?.trim() || null,

          referenceType:
            referenceType?.trim() || null,

          referenceId:
            referenceId?.trim() || null,

          inventoryId: inventory.id,

          createdById: user.id,
        },
      });

    return {
      inventory: updatedInventory,
      movement,
    };
  });
};


// ==========================================
// GET INVENTORY
// ==========================================

export const getInventories = async ({
  user,
  branchId,
  productId,
  search,
}) => {
  let selectedBranchId = branchId;

  // Manager/Cashier automatically use own branch
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

  const inventories =
    await prisma.inventory.findMany({
      where: {
        ...(selectedBranchId && {
          branchId: selectedBranchId,
        }),

        ...(productId && {
          productId,
        }),

        ...(search && {
          product: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },

              {
                sku: {
                  contains: search,
                  mode: "insensitive",
                },
              },

              {
                barcode: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
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

        product: {
          include: {
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },

            baseUnit: true,

            sellingUnit: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  return inventories.map((inventory) => {
    const availableQuantity =
      inventory.quantity.minus(
        inventory.reservedQuantity
      );

    const reorderLevel =
      inventory.product.reorderLevel;

    return {
      ...inventory,

      availableQuantity,

      isLowStock:
        availableQuantity.lte(
          reorderLevel
        ),
    };
  });
};


// ==========================================
// GET ONE INVENTORY
// ==========================================

export const getInventoryById = async ({
  user,
  inventoryId,
}) => {
  const inventory =
    await prisma.inventory.findUnique({
      where: {
        id: inventoryId,
      },

      include: {
        branch: true,

        product: {
          include: {
            category: true,
            baseUnit: true,
            sellingUnit: true,
          },
        },
      },
    });

  if (!inventory) {
    const error = new Error(
      "Inventory not found"
    );

    error.statusCode = 404;
    throw error;
  }

  validateBranchAccess(
    user,
    inventory.branchId
  );

  const availableQuantity =
    inventory.quantity.minus(
      inventory.reservedQuantity
    );

  return {
    ...inventory,

    availableQuantity,

    isLowStock:
      availableQuantity.lte(
        inventory.product.reorderLevel
      ),
  };
};