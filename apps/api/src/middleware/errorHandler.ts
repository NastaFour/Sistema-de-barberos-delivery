import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface PrismaError {
  code?: string;
  name?: string;
  status?: number;
  message?: string;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("Error:", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const prismaErr = err as PrismaError;

  if (prismaErr && typeof prismaErr === "object" && "code" in prismaErr) {
    if (prismaErr.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Resource already exists",
      });
    }

    if (prismaErr.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
  }

  if (prismaErr.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (prismaErr.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  const statusCode = (err as PrismaError).status || 500;
  const message = (err as PrismaError).message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
}
