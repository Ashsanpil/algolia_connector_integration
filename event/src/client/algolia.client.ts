import algoliasearch from 'algoliasearch';
import { logger } from '../utils/logger.utils';

// Algolia client initialization
const client = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_WRITE_API_KEY!);

// Function to create the Algolia index if it doesn't exist
export const createIndex = async (indexName: string | undefined, config?: object) => {
  try {
    // Use environment variables as fallback if the request doesn't provide them
    const finalIndexName = indexName || process.env.ALGOLIA_INDEX_NAME!;
    const finalIndexConfig = config || (process.env.ALGOLIA_INDEX_CONFIG ? JSON.parse(process.env.ALGOLIA_INDEX_CONFIG) : {});

    const index = client.initIndex(finalIndexName);

    // Check if the index already exists
    await index.getSettings();
    logger.info(`Index ${finalIndexName} already exists.`);
  } catch (error) {
    if (isAlgoliaError(error) && error.status === 404) {
      const finalIndexName = indexName || process.env.ALGOLIA_INDEX_NAME!;
      const finalIndexConfig = config || (process.env.ALGOLIA_INDEX_CONFIG ? JSON.parse(process.env.ALGOLIA_INDEX_CONFIG) : {});
      
      // Create the index if it doesn't exist
      const index = client.initIndex(finalIndexName);
      await index.setSettings(finalIndexConfig || {});
      logger.info(`Index ${finalIndexName} created with configuration:`, finalIndexConfig);
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
