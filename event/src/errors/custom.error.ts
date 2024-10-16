type ErrorItem = {
  statusCode: number;
  message: string;
  referencedBy?: string;
};

class CustomError extends Error {
  statusCode: number;
  errors?: ErrorItem[];

  constructor(statusCode: number, message: string, errors?: ErrorItem[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors || [];
  }
}

export class NotFoundError extends CustomError {
  constructor(entity: string, id: string) {
    super(404, `${entity} with ID ${id} was not found.`);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(400, message);
  }
}

export class ExternalApiError extends CustomError {
  constructor(message: string) {
    super(502, `External API Error: ${message}`);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(400, message);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string) {
    super(500, message);
  }
}

export default CustomError;
