import prisma from "../config/prisma.js";


const validatePromotionAccess = (
  user,
  promotion
) => {

  if (
    user.role === "ADMIN"
  ) {
    return;
  }


  if (
    user.role === "MANAGER"
  ) {

    if (
      !user.branchId ||
      promotion.branchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot manage this promotion"
        );

      error.statusCode = 403;

      throw error;
    }

    return;
  }


  const error =
    new Error(
      "You do not have permission to manage promotions"
    );

  error.statusCode = 403;

  throw error;
};


// ======================================================
// VALIDATE TARGET
// ======================================================

const validateTarget = async (
  db,
  {
    scope,
    productId,
    categoryId,
  }
) => {

  if (
    scope === "CART"
  ) {

    if (
      productId ||
      categoryId
    ) {

      const error =
        new Error(
          "CART promotion cannot have productId or categoryId"
        );

      error.statusCode = 400;

      throw error;
    }

    return;
  }


  if (
    scope === "PRODUCT"
  ) {

    if (!productId) {

      const error =
        new Error(
          "productId is required for PRODUCT promotion"
        );

      error.statusCode = 400;

      throw error;
    }


    if (categoryId) {

      const error =
        new Error(
          "PRODUCT promotion cannot contain categoryId"
        );

      error.statusCode = 400;

      throw error;
    }


    const product =
      await db.product.findUnique({
        where: {
          id:
            productId,
        },
      });


    if (!product) {

      const error =
        new Error(
          "Product not found"
        );

      error.statusCode = 404;

      throw error;
    }

    return;
  }


  if (
    scope === "CATEGORY"
  ) {

    if (!categoryId) {

      const error =
        new Error(
          "categoryId is required for CATEGORY promotion"
        );

      error.statusCode = 400;

      throw error;
    }


    if (productId) {

      const error =
        new Error(
          "CATEGORY promotion cannot contain productId"
        );

      error.statusCode = 400;

      throw error;
    }


    const category =
      await db.category.findUnique({
        where: {
          id:
            categoryId,
        },
      });


    if (!category) {

      const error =
        new Error(
          "Category not found"
        );

      error.statusCode = 404;

      throw error;
    }
  }
};


// ======================================================
// CREATE
// ======================================================

export const createPromotion =
  async ({
    user,
    data,
  }) => {

    let branchId =
      data.branchId ||
      null;


    // Manager can only create own-branch promotions
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


      branchId =
        user.branchId;
    }


    if (
      user.role !== "ADMIN" &&
      user.role !== "MANAGER"
    ) {

      const error =
        new Error(
          "Only Admin or Manager can create promotions"
        );

      error.statusCode = 403;

      throw error;
    }


    if (
      data.discountType ===
        "PERCENTAGE" &&
      data.value > 100
    ) {

      const error =
        new Error(
          "Percentage discount cannot exceed 100%"
        );

      error.statusCode = 400;

      throw error;
    }


    if (
      new Date(data.startAt) >=
      new Date(data.endAt)
    ) {

      const error =
        new Error(
          "Promotion end date must be after start date"
        );

      error.statusCode = 400;

      throw error;
    }


    if (branchId) {

      const branch =
        await prisma.branch.findUnique({
          where: {
            id:
              branchId,
          },
        });


      if (!branch) {

        const error =
          new Error(
            "Branch not found"
          );

        error.statusCode = 404;

        throw error;
      }
    }


    await validateTarget(
      prisma,
      data
    );


    return prisma.promotion.create({

      data: {

        code:
          data.code
            .trim()
            .toUpperCase(),

        name:
          data.name.trim(),

        description:
          data.description
            ?.trim() ||
          null,

        discountType:
          data.discountType,

        scope:
          data.scope,

        value:
          data.value,

        minPurchaseAmount:
          data.minPurchaseAmount ||
          0,

        maxDiscountAmount:
          data.maxDiscountAmount ||
          null,

        autoApply:
          data.autoApply,

        priority:
          data.priority,

        startAt:
          new Date(
            data.startAt
          ),

        endAt:
          new Date(
            data.endAt
          ),

        status:
          data.status,

        branchId,

        productId:
          data.scope ===
          "PRODUCT"
            ? data.productId
            : null,

        categoryId:
          data.scope ===
          "CATEGORY"
            ? data.categoryId
            : null,

        createdById:
          user.id,
      },
    });
  };


// ======================================================
// GET PROMOTIONS
// ======================================================

export const getPromotions =
  async ({
    user,
    status,
    scope,
  }) => {

    const where = {};


    if (status) {
      where.status =
        status;
    }


    if (scope) {
      where.scope =
        scope;
    }


    if (
      user.role === "MANAGER" ||
      user.role === "CASHIER"
    ) {

      where.OR = [

        {
          branchId:
            null,
        },

        {
          branchId:
            user.branchId,
        },
      ];
    }


    return prisma.promotion.findMany({

      where,

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
            name: true,
          },
        },

        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },

      orderBy: [
        {
          priority:
            "desc",
        },

        {
          createdAt:
            "desc",
        },
      ],
    });
  };


// ======================================================
// GET ONE
// ======================================================

export const getPromotionById =
  async ({
    user,
    promotionId,
  }) => {

    const promotion =
      await prisma.promotion.findUnique({

        where: {
          id:
            promotionId,
        },

        include: {
          branch: true,
          product: true,
          category: true,
        },
      });


    if (!promotion) {

      const error =
        new Error(
          "Promotion not found"
        );

      error.statusCode = 404;

      throw error;
    }


    if (
      user.role !== "ADMIN" &&
      promotion.branchId &&
      promotion.branchId !==
        user.branchId
    ) {

      const error =
        new Error(
          "You cannot access this promotion"
        );

      error.statusCode = 403;

      throw error;
    }


    return promotion;
  };


// ======================================================
// STATUS
// ======================================================

export const changePromotionStatus =
  async ({
    user,
    promotionId,
    status,
  }) => {

    const promotion =
      await prisma.promotion.findUnique({
        where: {
          id:
            promotionId,
        },
      });


    if (!promotion) {

      const error =
        new Error(
          "Promotion not found"
        );

      error.statusCode = 404;

      throw error;
    }


    validatePromotionAccess(
      user,
      promotion
    );


    return prisma.promotion.update({

      where: {
        id:
          promotionId,
      },

      data: {
        status,
      },
    });
  };