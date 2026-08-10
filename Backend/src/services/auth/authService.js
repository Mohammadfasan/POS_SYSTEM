import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/authToken/generateTokens.js";
import { hashToken } from "../../utils/authToken/hashToken.js";

const REFRESH_TOKEN_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

const sanitizeUser = (user) => ({
  id: user.id,
  employeeId: user.employeeId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
});

export const createUser = async ({
  employeeId,
  firstName,
  lastName,
  email,
  password,
  role,
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { employeeId: normalizedEmployeeId },
      ],
    },
  });

  if (existingUser) {
    const error = new Error("Email or employee ID already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      employeeId: normalizedEmployeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    },
  });

  return sanitizeUser(user);
};

export const loginUser = async ({ identifier, password }) => {
  const normalizedIdentifier = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier.toLowerCase() },
        { employeeId: normalizedIdentifier.toUpperCase() },
      ],
    },
  });

  if (!user) {
    const error = new Error("Invalid email, employee ID, or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "ACTIVE") {
    const error = new Error("Your account is not active");
    error.statusCode = 403;
    throw error;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const error = new Error(
      "Account temporarily locked. Try again later."
    );
    error.statusCode = 423;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const nextFailedAttempts = user.failedLoginAttempts + 1;

    const shouldLock =
      nextFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock
          ? 0
          : nextFailedAttempts,
        lockedUntil: shouldLock
          ? new Date(
              Date.now() +
                LOCK_TIME_MINUTES * 60 * 1000
            )
          : null,
      },
    });

    const error = new Error(
      shouldLock
        ? "Account locked for 15 minutes"
        : "Invalid email, employee ID, or password"
    );

    error.statusCode = shouldLock ? 423 : 401;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  const accessToken = generateAccessToken(updatedUser);
  const refreshToken = generateRefreshToken(updatedUser);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: updatedUser.id,
      expiresAt: new Date(
        Date.now() +
          REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });

  return {
    user: sanitizeUser(updatedUser),
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("Refresh token is required");
    error.statusCode = 401;
    throw error;
  }

  let decoded;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  if (decoded.type !== "refresh") {
    const error = new Error("Invalid token type");
    error.statusCode = 401;
    throw error;
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: hashToken(refreshToken),
    },
    include: {
      user: true,
    },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    const error = new Error("Refresh token is no longer valid");
    error.statusCode = 401;
    throw error;
  }

  if (storedToken.user.status !== "ACTIVE") {
    const error = new Error("User account is not active");
    error.statusCode = 403;
    throw error;
  }

  return {
    accessToken: generateAccessToken(storedToken.user),
    user: sanitizeUser(storedToken.user),
  };
};

export const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};