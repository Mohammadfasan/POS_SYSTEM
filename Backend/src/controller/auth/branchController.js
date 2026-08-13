import { z } from "zod";

import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  changeBranchStatus,
  assignUserToBranch,
  removeUserFromBranch,
  getBranchUsers,
} from "../../services/auth/branchService.js";

const branchSchema = z.object({
  code: z.string().min(2).max(20),

  name: z.string().min(2).max(100),

  phone: z.string().max(30).optional(),

  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("")),

  address: z.string().max(255).optional(),

  city: z.string().max(100).optional(),
});

const updateBranchSchema =
  branchSchema.partial();

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

// POST /api/branches
export const createBranchController = async (
  req,
  res,
  next
) => {
  try {
    const validatedData =
      branchSchema.parse(req.body);

    const branch = await createBranch(
      validatedData
    );

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: {
        branch,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/branches
export const getBranchesController = async (
  req,
  res,
  next
) => {
  try {
    const branches = await getAllBranches();

    res.status(200).json({
      success: true,
      count: branches.length,
      data: {
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/branches/:id
export const getBranchController = async (
  req,
  res,
  next
) => {
  try {
    const branch = await getBranchById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: {
        branch,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/branches/:id
export const updateBranchController = async (
  req,
  res,
  next
) => {
  try {
    const validatedData =
      updateBranchSchema.parse(req.body);

    const branch = await updateBranch(
      req.params.id,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: {
        branch,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/branches/:id/status
export const updateBranchStatusController =
  async (req, res, next) => {
    try {
      const { status } = statusSchema.parse(
        req.body
      );

      const branch =
        await changeBranchStatus(
          req.params.id,
          status
        );

      res.status(200).json({
        success: true,
        message: `Branch status changed to ${status}`,
        data: {
          branch,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// PATCH /api/branches/:branchId/users/:userId
export const assignUserController = async (
  req,
  res,
  next
) => {
  try {
    const { branchId, userId } = req.params;

    const user = await assignUserToBranch(
      branchId,
      userId
    );

    res.status(200).json({
      success: true,
      message:
        "User assigned to branch successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/branches/users/:userId
export const removeUserController = async (
  req,
  res,
  next
) => {
  try {
    const user = await removeUserFromBranch(
      req.params.userId
    );

    res.status(200).json({
      success: true,
      message:
        "User removed from branch successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/branches/:id/users
export const getBranchUsersController = async (
  req,
  res,
  next
) => {
  try {
    const users = await getBranchUsers(
      req.params.id
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};