import { Request, Response } from 'express';
import { post } from './event.controller';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia, removeProductFromAlgolia, ensureIndexExists } from '../client/algolia.client';
import CustomError from '../errors/custom.error';

// Mock modules
jest.mock('../services/product.service', () => ({
  createAlgoliaRecord: jest.fn(),
}));
jest.mock('../client/algolia.client', () => ({
  saveProductToAlgolia: jest.fn(),
  removeProductFromAlgolia: jest.fn(),
  ensureIndexExists: jest.fn(),
}));
jest.mock('../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Event Controller Integration Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockStatus = jest.fn().mockReturnThis();
  const mockSend = jest.fn().mockReturnThis();
  const mockJson = jest.fn().mockReturnThis();

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {
        message: {
          data: Buffer.from(JSON.stringify({
            resource: { id: 'mockProductId' },
            type: 'ProductPublished',
          })).toString('base64')
        }
      }
    };

    mockResponse = {
      status: mockStatus,
      send: mockSend,
      json: mockJson,
    };
  });

  test('should process ProductPublished event and save product to Algolia', async () => {
    // Arrange
    const mockAlgoliaRecord = { objectID: 'mockProductId' };
    (createAlgoliaRecord as jest.Mock).mockResolvedValue(mockAlgoliaRecord);
    (ensureIndexExists as jest.Mock).mockResolvedValue(undefined);
    
    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(ensureIndexExists).toHaveBeenCalled();
    expect(createAlgoliaRecord).toHaveBeenCalledWith('mockProductId');
    expect(saveProductToAlgolia).toHaveBeenCalledWith(mockAlgoliaRecord);
    expect(mockResponse.send).toHaveBeenCalledWith('HIT 👌');
    expect(mockResponse.status).toHaveBeenCalledWith(204);
  });

  test('should handle ProductUnpublished event and remove product from Algolia', async () => {
    // Arrange
    mockRequest.body.message.data = Buffer.from(JSON.stringify({
      resource: { id: 'mockProductId' },
      type: 'ProductUnpublished',
    })).toString('base64');
    
    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(removeProductFromAlgolia).toHaveBeenCalledWith('mockProductId');
    expect(mockResponse.send).toHaveBeenCalledWith('HIT 👌');
    expect(mockResponse.status).toHaveBeenCalledWith(204);
  });

  test('should return 400 if no message data is provided', async () => {
    // Arrange
    mockRequest.body.message.data = undefined;

    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Invalid or missing product data',
      details: [{ statusCode: 400, message: 'Product data is invalid or missing', referencedBy: 'Pub/Sub Event' }],
    });
  });

  test('should handle missing product ID and throw ProductNotFoundError', async () => {
    // Arrange
    mockRequest.body.message.data = Buffer.from(JSON.stringify({
      resource: {},
      type: 'ProductPublished',
    })).toString('base64');

    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ 
      message: 'Product with ID unknown not found',
      details: [{ statusCode: 404, message: 'Product unknown does not exist', referencedBy: 'Product Service' }],
    });
  });

  test('should handle unexpected errors with CustomError', async () => {
    // Arrange
    (ensureIndexExists as jest.Mock).mockImplementation(() => {
      throw new CustomError(500, 'Custom error message', [
        { statusCode: 500, message: 'Some error details', referencedBy: 'Test' },
      ]);
    });

    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      message: 'Custom error message', 
      details: [{ statusCode: 500, message: 'Some error details', referencedBy: 'Test' }] 
    });
  });
});
