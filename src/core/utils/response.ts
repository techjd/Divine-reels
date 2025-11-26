// Helper functions to ensure consistent JSON responses across the API.
export const formatSuccessResponse = <T>(data: T) => ({
  success: true,
  data
});

export const formatErrorResponse = (code: string, message: string, details?: unknown) => ({
  success: false,
  error: {
    code,
    message,
    details
  }
});
