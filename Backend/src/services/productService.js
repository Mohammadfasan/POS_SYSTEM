import prisma from "../config/prisma.js";

const productMeasurementMap = {
  FIXED: "COUNT",
  WEIGHT: "WEIGHT",
  VOLUME: "VOLUME",
  LENGTH: "LENGTH",
};

// =====================================
// VALIDATE CATEGORY + UNITS
// =====================================
const validateProductReferences = async ({
  categoryId,
  baseUnitId,
  sellingUnitId,
  productType,
}) => {
  const [category, baseUnit, sellingUnit] =
    await Promise.all([
      prisma.category.findUnique({
        where: { id: categoryId },
      }),

      prisma.unit.findUnique({
        where: { id: baseUnitId },
      }),

      prisma.unit.findUnique({
        where: { id: sellingUnitId },
      }),
    ]);

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (category.status !== "ACTIVE") {
    const error = new Error(
      "Selected category is inactive"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!baseUnit) {
    const error = new Error("Base unit not found");
    error.statusCode = 404;
    throw error;
  }

  if (!sellingUnit) {
    const error = new Error(
      "Selling unit not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (
    baseUnit.status !== "ACTIVE" ||
    sellingUnit.status !== "ACTIVE"
  ) {
    const error = new Error(
      "Selected units must be active"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!baseUnit.isBase) {
    const error = new Error(
      "Base unit must be marked as a base unit"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    baseUnit.measurementType !==
    sellingUnit.measurementType
  ) {
    const error = new Error(
      "Base unit and selling unit must use the same measurement type"
    );
    error.statusCode = 400;
    throw error;
  }

  const expectedMeasurement =
    productMeasurementMap[productType];

  if (
    baseUnit.measurementType !==
    expectedMeasurement
  ) {
    const error = new Error(
      `${productType} product requires ${expectedMeasurement} units`
    );

    error.statusCode = 400;
    throw error;
  }

  return {
    category,
    baseUnit,
    sellingUnit,
  };
};

// =====================================
// CREATE PRODUCT
// =====================================
export const createProduct = async (data) => {
  const sku = data.sku.trim().toUpperCase();

  const barcode =
    data.barcode?.trim() || null;

  const duplicate = await prisma.product.findFirst({
    where: {
      OR: [
        { sku },

        ...(barcode
          ? [{ barcode }]
          : []),
      ],
    },
  });

  if (duplicate) {
    const error = new Error(
      "SKU or barcode already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  await validateProductReferences({
    categoryId: data.categoryId,
    baseUnitId: data.baseUnitId,
    sellingUnitId: data.sellingUnitId,
    productType: data.productType,
  });

  const allowFractionalQuantity =
    data.productType === "FIXED"
      ? false
      : data.allowFractionalQuantity ?? true;

  return prisma.product.create({
    data: {
      sku,
      barcode,

      name: data.name.trim(),

      description:
        data.description?.trim() || null,

      brand:
        data.brand?.trim() || null,

      imageUrl:
        data.imageUrl?.trim() || null,

      productType: data.productType,

      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,

      taxRate: data.taxRate ?? 0,

      reorderLevel:
        data.reorderLevel ?? 0,

      allowFractionalQuantity,

      trackInventory:
        data.trackInventory ?? true,

      categoryId: data.categoryId,
      baseUnitId: data.baseUnitId,
      sellingUnitId: data.sellingUnitId,
    },

    include: {
      category: true,

      baseUnit: true,

      sellingUnit: true,
    },
  });
};

// =====================================
// GET PRODUCTS
// =====================================
export const getAllProducts = async ({
  page = 1,
  limit = 20,
  search,
  categoryId,
  productType,
  status,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(categoryId && {
      categoryId,
    }),

    ...(productType && {
      productType,
    }),

    ...(status && {
      status,
    }),

    ...(search && {
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

        {
          brand: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [products, total] =
    await prisma.$transaction([
      prisma.product.findMany({
        where,

        skip,

        take: limit,

        include: {
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          baseUnit: {
            select: {
              id: true,
              name: true,
              symbol: true,
              conversionFactor: true,
            },
          },

          sellingUnit: {
            select: {
              id: true,
              name: true,
              symbol: true,
              conversionFactor: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.product.count({
        where,
      }),
    ]);

  return {
    products,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// =====================================
// GET ONE PRODUCT
// =====================================
export const getProductById = async (
  productId
) => {
  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },

      include: {
        category: true,
        baseUnit: true,
        sellingUnit: true,
      },
    });

  if (!product) {
    const error = new Error(
      "Product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return product;
};

// =====================================
// GET PRODUCT BY BARCODE
// =====================================
export const getProductByBarcode = async (
  barcode
) => {
  const product =
    await prisma.product.findUnique({
      where: {
        barcode,
      },

      include: {
        category: true,
        baseUnit: true,
        sellingUnit: true,
      },
    });

  if (!product) {
    const error = new Error(
      "Product not found for this barcode"
    );

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

  return product;
};

// =====================================
// UPDATE PRODUCT
// =====================================
export const updateProduct = async (
  productId,
  data
) => {
  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!product) {
    const error = new Error(
      "Product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const sku =
    data.sku !== undefined
      ? data.sku.trim().toUpperCase()
      : product.sku;

  const barcode =
    data.barcode !== undefined
      ? data.barcode?.trim() || null
      : product.barcode;

  const duplicate =
    await prisma.product.findFirst({
      where: {
        id: {
          not: productId,
        },

        OR: [
          { sku },

          ...(barcode
            ? [{ barcode }]
            : []),
        ],
      },
    });

  if (duplicate) {
    const error = new Error(
      "SKU or barcode already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  const productType =
    data.productType ??
    product.productType;

  const categoryId =
    data.categoryId ??
    product.categoryId;

  const baseUnitId =
    data.baseUnitId ??
    product.baseUnitId;

  const sellingUnitId =
    data.sellingUnitId ??
    product.sellingUnitId;

  // Validate if relationship-related fields change
  if (
    data.categoryId !== undefined ||
    data.baseUnitId !== undefined ||
    data.sellingUnitId !== undefined ||
    data.productType !== undefined
  ) {
    await validateProductReferences({
      categoryId,
      baseUnitId,
      sellingUnitId,
      productType,
    });
  }

  return prisma.product.update({
    where: {
      id: productId,
    },

    data: {
      ...(data.sku !== undefined && {
        sku,
      }),

      ...(data.barcode !== undefined && {
        barcode,
      }),

      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.description !== undefined && {
        description:
          data.description?.trim() || null,
      }),

      ...(data.brand !== undefined && {
        brand:
          data.brand?.trim() || null,
      }),

      ...(data.imageUrl !== undefined && {
        imageUrl:
          data.imageUrl?.trim() || null,
      }),

      ...(data.productType !== undefined && {
        productType,
      }),

      ...(data.costPrice !== undefined && {
        costPrice: data.costPrice,
      }),

      ...(data.sellingPrice !== undefined && {
        sellingPrice:
          data.sellingPrice,
      }),

      ...(data.taxRate !== undefined && {
        taxRate: data.taxRate,
      }),

      ...(data.reorderLevel !== undefined && {
        reorderLevel:
          data.reorderLevel,
      }),

      ...(data.allowFractionalQuantity !==
        undefined && {
        allowFractionalQuantity:
          productType === "FIXED"
            ? false
            : data.allowFractionalQuantity,
      }),

      ...(data.trackInventory !== undefined && {
        trackInventory:
          data.trackInventory,
      }),

      ...(data.categoryId !== undefined && {
        categoryId,
      }),

      ...(data.baseUnitId !== undefined && {
        baseUnitId,
      }),

      ...(data.sellingUnitId !== undefined && {
        sellingUnitId,
      }),
    },

    include: {
      category: true,
      baseUnit: true,
      sellingUnit: true,
    },
  });
};

// =====================================
// CHANGE PRODUCT STATUS
// =====================================
export const changeProductStatus = async (
  productId,
  status
) => {
  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!product) {
    const error = new Error(
      "Product not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return prisma.product.update({
    where: {
      id: productId,
    },

    data: {
      status,
    },
  });
};