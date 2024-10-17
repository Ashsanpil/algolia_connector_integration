import CustomError from './custom.error';

// Define new custom errors by extending the base CustomError class

export class ProductNotFoundError extends CustomError {
  constructor(productId: string) {
    super(404, `Product with ID ${productId} not found`, [
      { statusCode: 404, message: `Product ${productId} does not exist`, referencedBy: 'Product Service' },
    ]);
  }
}

export class InvalidProductDataError extends CustomError {
  constructor() {
    super(400, 'Invalid or missing product data', [
      { statusCode: 400, message: 'Product data is invalid or missing', referencedBy: 'Pub/Sub Event' },
    ]);
  }
}

export class AlgoliaIndexingError extends CustomError {
  constructor(productId: string) {
    super(500, `Failed to index product ${productId} in Algolia`, [
      { statusCode: 500, message: `Failed to index product ${productId}`, referencedBy: 'Algolia Service' },
    ]);
  }
}
