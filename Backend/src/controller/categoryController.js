import { z } from "zod";

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  changeCategoryStatus,
} from "../services/categoryService.js";

const createCategorySchema = z.object({
  code: z
    .string()
    .min(2, "Category code is required")
    .max(20),

  name: z
    .string()
    .min(2, "Category name is required")
    .max(100),

  description: z
    .string()
    .max(500)
    .optional(),
});

const updateCategorySchema =
  createCategorySchema.partial();

const categoryStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

// CREATE
export const createCategoryController =
  async (req, res, next) => {
    try {
      const validatedData =
        createCategorySchema.parse(req.body);

      const category =
        await createCategory(validatedData);

      res.status(201).json({
        success: true,
        message:
          "Category created successfully",
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET ALL
export const getCategoriesController =
  async (req, res, next) => {
    try {
      const categories =
        await getAllCategories({
          status: req.query.status,
        });

      res.status(200).json({
        success: true,
        count: categories.length,
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// GET ONE
export const getCategoryController =
  async (req, res, next) => {
    try {
      const category =
        await getCategoryById(req.params.id);

      res.status(200).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// UPDATE
export const updateCategoryController =
  async (req, res, next) => {
    try {
      const validatedData =
        updateCategorySchema.parse(req.body);

      const category =
        await updateCategory(
          req.params.id,
          validatedData
        );

      res.status(200).json({
        success: true,
        message:
          "Category updated successfully",
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// STATUS
export const updateCategoryStatusController =
  async (req, res, next) => {
    try {
      const { status } =
        categoryStatusSchema.parse(req.body);

      const category =
        await changeCategoryStatus(
          req.params.id,
          status
        );

      res.status(200).json({
        success: true,
        message: `Category status changed to ${status}`,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  };