import { z } from "zod";

import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  changeProductStatus,
} from "../services/productService.js";

const productTypes = [
  "FIXED",
  "WEIGHT",
  "VOLUME",
  "LENGTH",
];

const createProductSchema = z.object({
  sku: z.string().min(2).max(50),

  barcode: z
    .string()
    .max(100)
    .optional(),

  name: z.string().min(2).max(150),

  description: z
    .string()
    .max(1000)
    .optional(),

  brand: z
    .string()
    .max(100)
    .optional(),

  imageUrl: z
    .string()
    .url()
    .optional(),

  productType:
    z.enum(productTypes),

  costPrice: z
    .number()
    .nonnegative(),

  sellingPrice: z
    .number()
    .positive(),

  taxRate: z
    .number()
    .min(0)
    .max(100)
    .optional(),

  reorderLevel: z
    .number()
    .nonnegative()
    .optional(),

  allowFractionalQuantity:
    z.boolean().optional(),

  trackInventory:
    z.boolean().optional(),

  categoryId: z
    .string()
    .uuid(),

  baseUnitId: z
    .string()
    .uuid(),

  sellingUnitId: z
    .string()
    .uuid(),
});

const updateProductSchema =
  createProductSchema
    .partial()
    .extend({
      barcode: z
        .union([
          z.string().max(100),
          z.null(),
        ])
        .optional(),

      imageUrl: z
        .union([
          z.string().url(),
          z.null(),
        ])
        .optional(),
    });

const productStatusSchema = z.object({
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
    "DISCONTINUED",
  ]),
});

// CREATE
export const createProductController =
  async (req, res, next) => {
    try {
      const validatedData =
        createProductSchema.parse(req.body);

      const product =
        await createProduct(
          validatedData
        );

      res.status(201).json({
        success: true,
        message:
          "Product created successfully",

        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET ALL
export const getProductsController =
  async (req, res, next) => {
    try {
      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(req.query.limit) || 20,
            1
          ),
          100
        );

      const result =
        await getAllProducts({
          page,
          limit,

          search:
            req.query.search,

          categoryId:
            req.query.categoryId,

          productType:
            req.query.productType,

          status:
            req.query.status,
        });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

// GET ONE
export const getProductController =
  async (req, res, next) => {
    try {
      const product =
        await getProductById(
          req.params.id
        );

      res.status(200).json({
        success: true,

        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// BARCODE
export const getProductBarcodeController =
  async (req, res, next) => {
    try {
      const product =
        await getProductByBarcode(
          req.params.barcode
        );

      res.status(200).json({
        success: true,

        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// UPDATE
export const updateProductController =
  async (req, res, next) => {
    try {
      const validatedData =
        updateProductSchema.parse(
          req.body
        );

      const product =
        await updateProduct(
          req.params.id,
          validatedData
        );

      res.status(200).json({
        success: true,

        message:
          "Product updated successfully",

        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// STATUS
export const updateProductStatusController =
  async (req, res, next) => {
    try {
      const { status } =
        productStatusSchema.parse(
          req.body
        );

      const product =
        await changeProductStatus(
          req.params.id,
          status
        );

      res.status(200).json({
        success: true,

        message:
          `Product status changed to ${status}`,

        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  };