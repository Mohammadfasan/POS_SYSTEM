import prisma from "../config/prisma.js";

// Create category
export const createCategory = async ({
  code,
  name,
  description,
}) => {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedName = name.trim();

  const existingCategory =
    await prisma.category.findFirst({
      where: {
        OR: [
          { code: normalizedCode },
          {
            name: {
              equals: normalizedName,
              mode: "insensitive",
            },
          },
        ],
      },
    });

  if (existingCategory) {
    const error = new Error(
      "Category code or name already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.category.create({
    data: {
      code: normalizedCode,
      name: normalizedName,
      description: description?.trim() || null,
    },
  });
};

// Get all categories
export const getAllCategories = async ({
  status,
} = {}) => {
  return prisma.category.findMany({
    where: {
      ...(status && { status }),
    },

    orderBy: {
      name: "asc",
    },
  });
};

// Get one category
export const getCategoryById = async (
  categoryId
) => {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

// Update category
export const updateCategory = async (
  categoryId,
  data
) => {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  let normalizedCode;
  let normalizedName;

  if (data.code) {
    normalizedCode = data.code
      .trim()
      .toUpperCase();
  }

  if (data.name) {
    normalizedName = data.name.trim();
  }

  if (normalizedCode || normalizedName) {
    const duplicate =
      await prisma.category.findFirst({
        where: {
          id: {
            not: categoryId,
          },

          OR: [
            ...(normalizedCode
              ? [{ code: normalizedCode }]
              : []),

            ...(normalizedName
              ? [
                  {
                    name: {
                      equals: normalizedName,
                      mode: "insensitive",
                    },
                  },
                ]
              : []),
          ],
        },
      });

    if (duplicate) {
      const error = new Error(
        "Category code or name already exists"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.category.update({
    where: {
      id: categoryId,
    },

    data: {
      ...(normalizedCode && {
        code: normalizedCode,
      }),

      ...(normalizedName && {
        name: normalizedName,
      }),

      ...(data.description !== undefined && {
        description:
          data.description?.trim() || null,
      }),
    },
  });
};

// Change status
export const changeCategoryStatus = async (
  categoryId,
  status
) => {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.category.update({
    where: {
      id: categoryId,
    },

    data: {
      status,
    },
  });
};