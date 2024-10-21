import { Request, Response } from 'express';
import { createAlgoliaRecord } from '../services/product.service';
import { saveProductToAlgolia, createIndex } from '../client/algolia.client'; // Add createIndex
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

    // Extract the Algolia index name and configuration from the environment or request config
    const indexName = process.env.ALGOLIA_INDEX_NAME || request.body.indexName;
    const indexConfig = process.env.ALGOLIA_INDEX_CONFIG
      ? JSON.parse(process.env.ALGOLIA_INDEX_CONFIG)
      : request.body.indexConfig;

    // Check if the index exists, and if not, create a new one with the user-provided configuration
    await createIndex(indexName, indexConfig);

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
      // Ensure statusCode is a number before passing it to response.status
      const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
      response.status(statusCode).json({ message: error.message });
    } else {
      // Handle generic errors
      response.status(500).json({ message: `Error processing product: ${String(error)}` });
    }
  }
};
