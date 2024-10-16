import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia } from '../client/algolia.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';

export const post = async (request: Request, response: Response) => {
  try {
    // Log when an event message is received
    logger.info('Received an event from Pub/Sub.');

    if (!request.body || !request.body.message) {
      throw new CustomError(400, 'Bad request: Invalid Pub/Sub message');
    }

    const pubSubMessage = request.body.message;

    // Decode the message
    const decodedData = pubSubMessage.data
      ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
      : undefined;

    if (!decodedData) {
      throw new CustomError(400, 'Bad request: Empty message data');
    }

    const jsonData = JSON.parse(decodedData);
    const productId = jsonData.productProjection.id;

    // Log product ID to confirm successful data extraction
    logger.info(`Processing product with ID: ${productId}`);

    // Create Algolia record from product data
    const algoliaRecord = await createAlgoliaRecord(productId);

    // Save product to Algolia
    await saveProductToAlgolia(algoliaRecord);

    // Log successful indexing in Algolia
    logger.info(`Product ${productId} successfully indexed in Algolia`);

    // Send a response to acknowledge the request
    response.status(204).send();
  } catch (error) {
    // Log any errors encountered during processing
    logger.error('Error processing product:', error);

    if (error instanceof CustomError) {
      throw error;
    }

    throw new CustomError(500, `Error processing product: ${error}`);
  }
};
