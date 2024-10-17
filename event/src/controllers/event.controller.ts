import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia } from '../client/algolia.client';
import { ProductNotFoundError, InvalidProductDataError, AlgoliaIndexingError } from '../errors/custom.errors.extended';
import CustomError from '../errors/custom.error'; // Import the base CustomError
import { logger } from '../utils/logger.utils';

export const post = async (request: Request, response: Response) => {
  try {
    logger.info('Received an event from Pub/Sub.');

    if (!request.body || !request.body.message) {
      throw new InvalidProductDataError();
    }

    const pubSubMessage = request.body.message;
    const decodedData = pubSubMessage.data
      ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
      : undefined;

    if (!decodedData) {
      throw new InvalidProductDataError();
    }

    const jsonData = JSON.parse(decodedData);
    const productId = jsonData.productProjection?.id;

    if (!productId) {
      throw new InvalidProductDataError();
    }

    logger.info(`Processing product with ID: ${productId}`);

    const algoliaRecord = await createAlgoliaRecord(productId).catch(() => {
      throw new ProductNotFoundError(productId);
    });

    await saveProductToAlgolia(algoliaRecord).catch(() => {
      throw new AlgoliaIndexingError(productId);
    });

    logger.info(`Product ${productId} successfully indexed in Algolia`);
    response.status(204).send();
  } catch (error) {
    logger.error('Error processing product:', error);

    if (error instanceof CustomError) {
      // Ensure statusCode is a number before using it
      const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500; 
      response.status(statusCode).json({ message: error.message, errors: error.errors });
    } else {
      response.status(500).json({ message: 'Internal Server Error', details: (error as Error).message });
    }
  }
};
