export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const apiResponse = {
  success: (res: any, message: string, data?: any, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
  },
  successWithPagination: (res: any, message: string, data: any, pagination: any, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data, pagination });
  },
  error: (res: any, message: string, error?: string, statusCode = 500) => {
    return res.status(statusCode).json({ success: false, message, error });
  }
};

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}
