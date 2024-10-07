import { Request, Response } from 'express';
import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import algoliasearch from 'algoliasearch'; // Import from the main package

// Initialize the Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_WRITE_API_KEY || '' // Use Write API Key for indexing
);

// Initialize the index using the algoliaClient instance
const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || '');

export const post = async (request: Request, response: Response) => {
  try {
    // Log when an event message is received
    logger.info('Received an event from Pub/Sub.');

    if (!request.body || !request.body.message) {
      throw new CustomError(400, 'Bad request: Invalid Pub/Sub message');
    }

    const pubSubMessage = request.body.message;

    // Log base64 encoded message data
    logger.info(`Pub/Sub message received with data: ${pubSubMessage.data}`);

    // Decode the message
    const decodedData = pubSubMessage.data
      ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
      : undefined;

    if (!decodedData) {
      throw new CustomError(400, 'Bad request: Empty message data');
    }

    // Log decoded message data
    logger.info(`Decoded message data: ${decodedData}`);

    const jsonData = JSON.parse(decodedData);
    const productId = jsonData.resource.id;

    // Log product ID to confirm successful data extraction
    logger.info(`Processing product with ID: ${productId}`);

    // Fetch the product from commercetools
    const { body: product } = await createApiRoot()
      .products()
      .withId({ ID: productId })
      .get()
      .execute();

    // Log when product is successfully fetched from commercetools
    logger.info(`Successfully fetched product details for ID: ${productId}`);

    // Create an Algolia record from the product data
    const algoliaRecord = {
      objectID: product.id,
      productKey: product.key,
      productType: product.productType.id,
      name: product.masterData.current.name,
      description: product.masterData.current.description,
      categories: product.masterData.current.categories.map((cat) => cat.id),
      variants: product.masterData.current.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        prices: variant.prices,
        attributes: variant.attributes,
      })),
      masterVariant: {
        id: product.masterData.current.masterVariant.id,
        sku: product.masterData.current.masterVariant.sku,
        prices: product.masterData.current.masterVariant.prices,
        attributes: product.masterData.current.masterVariant.attributes,
      },
    };

    // Log Algolia record creation
    logger.info(`Algolia record created for product ID: ${productId}`);

    // Save the product to Algolia
    await algoliaIndex.saveObject(algoliaRecord);

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
