import { ZodError } from "zod";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  console.error(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A unique value already exists",
      fields: error.meta?.target,
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.message || "Internal server error",
  });
};