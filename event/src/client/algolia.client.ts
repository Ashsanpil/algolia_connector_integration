import algoliasearch from 'algoliasearch';
import { logger } from '../utils/logger.utils';

// Algolia client initialization
const client = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_WRITE_API_KEY!);

// Function to create the Algolia index if it doesn't exist
export const createIndex = async (indexName: string, config?: object) => {
  try {
    const index = client.initIndex(indexName);

    // Check if the index already exists
    await index.getSettings();
    logger.info(`Index ${indexName} already exists.`);
  } catch (error) {
    // Use type narrowing to check if 'error' has a 'status' property
    if (isAlgoliaError(error) && error.status === 404) {
      // If index doesn't exist, create it
      const index = client.initIndex(indexName);
      await index.setSettings(config || {});
      logger.info(`Index ${indexName} created with configuration:`, config);
    } else {
      throw error;
    }
  }
};

// Function to save a product to the Algolia index
export const saveProductToAlgolia = async (record: object) => {
  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME!);
  await index.saveObject(record);
};

// Type guard to check if the error is from Algolia
function isAlgoliaError(error: any): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}
