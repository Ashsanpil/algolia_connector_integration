// controllers/event.controller.ts
import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia, createIndex } from '../client/algolia.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { ProductNotFoundError, InvalidProductDataError, AlgoliaIndexingError } from '../errors/custom.errors.extended';

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
      throw new ProductNotFoundError('unknown');
    }

    logger.info(`Processing product with ID: ${productId}`);

    const indexName = request.body.indexName;
    const indexConfig = request.body.indexConfig;

    const algoliaRecord = await createAlgoliaRecord(productId);
    await createIndex(indexName, indexConfig);
    await saveProductToAlgolia(algoliaRecord);

    logger.info(`Product ${productId} successfully indexed in Algolia`);

    response.status(204).send();
  } catch (error) {
    logger.error('Error processing product:', error);

    if (error instanceof CustomError) {
      const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
      response.status(statusCode).json({ message: error.message, details: error.errors });
    } else {
      response.status(500).json({ message: 'Internal server error', error: String(error) });
    }
  }
};
