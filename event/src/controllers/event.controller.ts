import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia, removeProductFromAlgolia, ensureIndexExists } from '../client/algolia.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { ProductNotFoundError, InvalidProductDataError } from '../errors/custom.errors.extended';

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
    const productId = jsonData.resource?.id;
    const eventType = jsonData.type;

    logger.info(`Decoded Data: ${decodedData}`);

    if (!productId) {
      throw new ProductNotFoundError('unknown');
    }

    logger.info(`Processing product with ID: ${productId}`);

    // Ensure the index exists or is created with proper configuration if it doesn't exist
    await ensureIndexExists();

    if (eventType === 'ProductPublished') {
      const algoliaRecord = await createAlgoliaRecord(productId);
      await saveProductToAlgolia(algoliaRecord);
      logger.info(`Product ${productId} successfully indexed in Algolia.`);
    } else if (eventType === 'ProductUnpublished') {
      await removeProductFromAlgolia(productId);
      logger.info(`Product ${productId} has been unpublished and removed from Algolia index.`);
    } else {
      logger.warn(`Unhandled event type: ${eventType}`);
    }

    response.status(204).send('HIT 👌');
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
