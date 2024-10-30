import algoliasearch from 'algoliasearch';
import { logger } from '../utils/logger.utils';

// Algolia client initialization
const client = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_WRITE_API_KEY!);

// Function to check if the Algolia index exists or create it with the correct configuration
export const ensureIndexExists = async () => {
  const finalIndexName = process.env.ALGOLIA_INDEX_NAME!;
  const finalIndexConfig = process.env.ALGOLIA_INDEX_CONFIG ? JSON.parse(process.env.ALGOLIA_INDEX_CONFIG) : {};

  const index = client.initIndex(finalIndexName);

  try {
    // Check if the index exists
    await index.getSettings();
    logger.info(`Index ${finalIndexName} already exists. No changes to configuration.`);
  } catch (error) {
    if (isAlgoliaError(error) && error.status === 404) {
      // If index doesn't exist, create it with the desired configuration
      await index.setSettings(finalIndexConfig);
      logger.info(`Index ${finalIndexName} created with configuration:`, finalIndexConfig);
    } else {
      // Throw the error if it's unexpected
      throw new Error(`Unexpected error occurred: ${JSON.stringify(error)}`);
    }
  }
};

// Function to save a product to the Algolia index
export const saveProductToAlgolia = async (record: object) => {
  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME!);
  await index.saveObject(record);
};

// Function to remove a product from the Algolia index
export const removeProductFromAlgolia = async (productId: string) => {
  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME!);
  await index.deleteObject(productId);
  logger.info(`Product with ID ${productId} removed from Algolia index.`);
};

// Type guard to check if the error is from Algolia
function isAlgoliaError(error: any): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}
