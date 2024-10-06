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
    if (!request.body || !request.body.message) {
      throw new CustomError(400, 'Bad request: Invalid Pub/Sub message');
    }

    const pubSubMessage = request.body.message;
    const decodedData = pubSubMessage.data
      ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
      : undefined;

    if (!decodedData) {
      throw new CustomError(400, 'Bad request: Empty message data');
    }

    const jsonData = JSON.parse(decodedData);
    const productId = jsonData.resource.id;

    logger.info(`Processing product with ID: ${productId}`);

    const { body: product } = await createApiRoot()
      .products()
      .withId({ ID: productId })
      .get()
      .execute();

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

    await algoliaIndex.saveObject(algoliaRecord);

    logger.info(`Product ${productId} successfully indexed in Algolia`);
    response.status(204).send();
  } catch (error) {
    logger.error('Error processing product:', error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, `Error processing product: ${error}`);
  }
};
