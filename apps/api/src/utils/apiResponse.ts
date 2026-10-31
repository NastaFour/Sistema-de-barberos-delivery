import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export const apiResponse = {
  success: (res: Response, message: string, data?: unknown, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
  },
  successWithPagination: (
    res: Response,
    message: string,
    data: unknown,
    pagination: PaginationMeta,
    statusCode = 200,
  ) => {
    return res.status(statusCode).json({ success: true, message, data, pagination });
  },
  error: (res: Response, message: string, error?: string, statusCode = 500) => {
    return res.status(statusCode).json({ success: false, message, error });
  },
};

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return { success: false, error, message };
}
