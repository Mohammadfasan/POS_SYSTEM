import { z } from "zod";
import {
  createUser,
  getUserById,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../../services/auth/authService.js";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or employee ID is required"),
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = z.object({
  employeeId: z.string().min(3).max(30),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await loginUser(validatedData);

    res.cookie(
      "refreshToken",
      result.refreshToken,
      cookieOptions
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSystemUser = async (
  req,
  res,
  next
) => {
  try {
    const validatedData = createUserSchema.parse(
      req.body
    );

    const user = await createUser(validatedData);

    res.status(201).json({
      success: true,
      message: `${user.role} account created successfully`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token =
      req.cookies.refreshToken ||
      req.body.refreshToken;

    const result = await refreshAccessToken(token);

    res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    await logoutUser(token);

    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req,
  res,
  next
) => {
  try {
    const user = await getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};