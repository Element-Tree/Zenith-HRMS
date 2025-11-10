/**
 * Utility function to safely extract error messages from API responses
 * Handles various error formats including FastAPI validation errors
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Check for axios error response
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // Handle array of validation errors (FastAPI Pydantic validation)
    if (Array.isArray(detail)) {
      return detail.map(err => {
        if (typeof err === 'object' && err.msg) {
          const location = err.loc ? err.loc.join(' > ') : 'Field';
          return `${location}: ${err.msg}`;
        }
        return typeof err === 'string' ? err : JSON.stringify(err);
      }).join(', ');
    }
    
    // Handle string error messages
    if (typeof detail === 'string') {
      return detail;
    }
    
    // Handle object error (shouldn't render directly in React)
    if (typeof detail === 'object') {
      // If it's a validation error object
      if (detail.msg) {
        const location = detail.loc ? detail.loc.join(' > ') : 'Field';
        return `${location}: ${detail.msg}`;
      }
      return JSON.stringify(detail);
    }
  }

  // Check for error.message
  if (error.message) {
    return error.message;
  }

  // Fallback to default message
  return defaultMessage;
};
