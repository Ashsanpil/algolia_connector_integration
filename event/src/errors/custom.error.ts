type ErrorItem = {
  statusCode: number | string;
  message: string;
  referencedBy?: string;
};

class CustomError extends Error {
  statusCode: number | string;
  message: string;
  errors?: ErrorItem[];

  constructor(
    statusCode: number | string,
    message: string,
    errors?: ErrorItem[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    if (errors) {
      this.errors = errors;
    }
  }
}

// Custom error for validation-related issues
class ValidationError extends CustomError {
  constructor(message: string, errors?: ErrorItem[]) {
    super(400, message, errors);
    this.name = 'ValidationError';
  }
}

// Custom error for cases when a resource is not found
class NotFoundError extends CustomError {
  constructor(resource: string, id: string) {
    const message = `${resource} with ID ${id} not found.`;
    super(404, message);
    this.name = 'NotFoundError';
  }
}

// Custom error for issues with external services like commercetools or Algolia
class ExternalApiError extends CustomError {
  constructor(serviceName: string, message: string, statusCode: number = 500) {
    super(statusCode, `Error from ${serviceName}: ${message}`);
    this.name = 'ExternalApiError';
  }
}

// Custom error for internal server issues
class InternalServerError extends CustomError {
  constructor(message: string = 'Internal Server Error') {
    super(500, message);
    this.name = 'InternalServerError';
  }
}

// Custom error for unauthorized access attempts
class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized Access') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export { 
  CustomError, 
  ValidationError, 
  NotFoundError, 
  ExternalApiError, 
  InternalServerError, 
  UnauthorizedError 
};
