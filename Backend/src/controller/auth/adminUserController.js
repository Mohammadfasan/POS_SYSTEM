import { z } from "zod";
import prisma from "../../config/prisma.js";

// ======================================================
// VALIDATION
// ======================================================

const updateUserSchema = z.object({
  employeeId: z
    .string()
    .min(2)
    .max(50)
    .optional(),

  firstName: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  lastName: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  email: z
    .string()
    .email()
    .optional(),

  role: z
    .enum([
      "ADMIN",
      "MANAGER",
      "CASHIER",
    ])
    .optional(),
});

const statusSchema = z.object({
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
  ]),
});

// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ======================================================

export const getSystemUsers =
  async (req, res, next) => {
    try {
      const {
        search,
        role,
        status,
        branchId,
      } = req.query;

      const where = {};

      // ROLE FILTER
      if (role) {
        where.role = role;
      }

      // STATUS FILTER
      if (status) {
        where.status = status;
      }

      // BRANCH FILTER
      if (branchId) {
        where.branchId =
          branchId;
      }

      // SEARCH
      if (search) {
        where.OR = [
          {
            employeeId: {
              contains:
                search,
              mode: "insensitive",
            },
          },

          {
            firstName: {
              contains:
                search,
              mode: "insensitive",
            },
          },

          {
            lastName: {
              contains:
                search,
              mode: "insensitive",
            },
          },

          {
            email: {
              contains:
                search,
              mode: "insensitive",
            },
          },
        ];
      }

      const users =
        await prisma.user.findMany({
          where,

          select: {
            id: true,

            employeeId: true,

            firstName: true,

            lastName: true,

            email: true,

            role: true,

            status: true,

            branchId: true,

            failedLoginAttempts:
              true,

            lockedUntil: true,

            lastLoginAt: true,

            createdAt: true,

            updatedAt: true,

            branch: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      res.status(200).json({
        success: true,

        count:
          users.length,

        data: {
          users,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// GET ONE USER
// GET /api/admin/users/:id
// ======================================================

export const getSystemUser =
  async (req, res, next) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
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

            lastLoginAt: true,

            createdAt: true,

            updatedAt: true,

            branch: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },
        });

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "User not found",
          });
      }

      res.status(200).json({
        success: true,

        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// UPDATE USER
// PATCH /api/admin/users/:id
// ======================================================

export const updateSystemUser =
  async (req, res, next) => {
    try {
      const validatedData =
        updateUserSchema.parse(
          req.body
        );

      const existingUser =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!existingUser) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "User not found",
          });
      }

      // ----------------------------------------------
      // CHECK EMPLOYEE ID
      // ----------------------------------------------

      if (
        validatedData.employeeId &&
        validatedData.employeeId !==
          existingUser.employeeId
      ) {
        const employeeExists =
          await prisma.user.findUnique({
            where: {
              employeeId:
                validatedData.employeeId,
            },
          });

        if (employeeExists) {
          return res
            .status(409)
            .json({
              success: false,

              message:
                "Employee ID already exists",
            });
        }
      }

      // ----------------------------------------------
      // CHECK EMAIL
      // ----------------------------------------------

      if (
        validatedData.email &&
        validatedData.email !==
          existingUser.email
      ) {
        const emailExists =
          await prisma.user.findUnique({
            where: {
              email:
                validatedData.email,
            },
          });

        if (emailExists) {
          return res
            .status(409)
            .json({
              success: false,

              message:
                "Email already exists",
            });
        }
      }

      const user =
        await prisma.user.update({
          where: {
            id: req.params.id,
          },

          data: validatedData,

          select: {
            id: true,

            employeeId: true,

            firstName: true,

            lastName: true,

            email: true,

            role: true,

            status: true,

            branchId: true,

            lastLoginAt: true,

            createdAt: true,

            updatedAt: true,

            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

      res.status(200).json({
        success: true,

        message:
          "User updated successfully",

        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

// ======================================================
// CHANGE USER STATUS
// PATCH /api/admin/users/:id/status
// ======================================================

export const updateSystemUserStatus =
  async (req, res, next) => {
    try {
      const { status } =
        statusSchema.parse(
          req.body
        );

      const existingUser =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!existingUser) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "User not found",
          });
      }

      // Optional protection:
      // prevent admin disabling own account

      if (
        req.user.id ===
          req.params.id &&
        status !== "ACTIVE"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "You cannot disable your own account",
          });
      }

      const user =
        await prisma.user.update({
          where: {
            id: req.params.id,
          },

          data: {
            status,

            // reset lock when activated
            ...(status ===
            "ACTIVE"
              ? {
                  failedLoginAttempts:
                    0,

                  lockedUntil:
                    null,
                }
              : {}),
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

            lastLoginAt: true,

            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });

      res.status(200).json({
        success: true,

        message: `User status changed to ${status}`,

        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };