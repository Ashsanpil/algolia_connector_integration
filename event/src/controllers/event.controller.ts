import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia } from '../client/algolia.client';
import { 
  NotFoundError, 
  ValidationError, 
  ExternalApiError 
} from '../errors/custom.error';
import { logger } from '../utils/logger.utils';

export const post = async (request: Request, response: Response) => {
  try {
    logger.info('Received an event from Pub/Sub.');

    // Validate that the message body exists
    if (!request.body || !request.body.message) {
      throw new ValidationError('Invalid Pub/Sub message');
    }

    const pubSubMessage = request.body.message;
    const decodedData = pubSubMessage.data
      ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
      : undefined;

    if (!decodedData) {
      throw new ValidationError('Empty message data');
    }

    const jsonData = JSON.parse(decodedData);
    const productId = jsonData.productProjection?.id;

    if (!productId) {
      throw new NotFoundError('Product', 'unknown');
    }

    // Log product ID to confirm successful data extraction
    logger.info(`Processing product with ID: ${productId}`);

    // Fetch and index product
    const algoliaRecord = await createAlgoliaRecord(productId);
    await saveProductToAlgolia(algoliaRecord);

    logger.info(`Product ${productId} successfully indexed in Algolia`);
    response.status(204).send();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      response.status(Number(error.statusCode)).json({ error: error.message });
    } else if (error instanceof ExternalApiError) {
      logger.error(`Error from external service: ${error.message}`);
      response.status(Number(error.statusCode)).json({ error: error.message });
    } else {
      logger.error('Internal server error:', error);
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
