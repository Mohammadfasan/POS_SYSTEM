import { z } from "zod";

import {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  changeUnitStatus,
} from "../services/unitService.js";

const measurementTypes = [
  "COUNT",
  "WEIGHT",
  "VOLUME",
  "LENGTH",
];

const createUnitSchema = z.object({
  code: z.string().min(1).max(20),

  name: z.string().min(2).max(50),

  symbol: z.string().min(1).max(10),

  measurementType:
    z.enum(measurementTypes),

  conversionFactor: z
    .number()
    .positive(),

  isBase: z.boolean().default(false),
});

const updateUnitSchema = z.object({
  code: z.string().min(1).max(20).optional(),

  name: z.string().min(2).max(50).optional(),

  symbol: z
    .string()
    .min(1)
    .max(10)
    .optional(),

  conversionFactor: z
    .number()
    .positive()
    .optional(),
});

const unitStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

// Create
export const createUnitController =
  async (req, res, next) => {
    try {
      const validatedData =
        createUnitSchema.parse(req.body);

      const unit =
        await createUnit(validatedData);

      res.status(201).json({
        success: true,
        message: "Unit created successfully",
        data: {
          unit,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// Get all
export const getUnitsController =
  async (req, res, next) => {
    try {
      const units =
        await getAllUnits({
          status: req.query.status,
          measurementType:
            req.query.measurementType,
        });

      res.status(200).json({
        success: true,
        count: units.length,
        data: {
          units,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// Get one
export const getUnitController =
  async (req, res, next) => {
    try {
      const unit =
        await getUnitById(req.params.id);

      res.status(200).json({
        success: true,
        data: {
          unit,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// Update
export const updateUnitController =
  async (req, res, next) => {
    try {
      const validatedData =
        updateUnitSchema.parse(req.body);

      const unit =
        await updateUnit(
          req.params.id,
          validatedData
        );

      res.status(200).json({
        success: true,
        message:
          "Unit updated successfully",
        data: {
          unit,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// Status
export const updateUnitStatusController =
  async (req, res, next) => {
    try {
      const { status } =
        unitStatusSchema.parse(req.body);

      const unit =
        await changeUnitStatus(
          req.params.id,
          status
        );

      res.status(200).json({
        success: true,
        message: `Unit status changed to ${status}`,
        data: {
          unit,
        },
      });
    } catch (error) {
      next(error);
    }
  };