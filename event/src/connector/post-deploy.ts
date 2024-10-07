import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';
import { createProductPublishSubscription } from './actions';
import algoliasearch from 'algoliasearch'; // Importing the default package
import dotenv from 'dotenv';
dotenv.config();

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_WRITE_API_KEY || ''
);

// Initialize the index
const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || '');

// Function to handle both Algolia and Pub/Sub integration
export const postDeploy = async (properties: Map<string, unknown>) => {
  try {
    const apiRoot = createApiRoot();

    const topicName = properties.get('CONNECT_GCP_TOPIC_NAME');
    const projectId = properties.get('CONNECT_GCP_PROJECT_ID');
    if (!topicName || !projectId) {
      throw new Error('Topic name or project ID not found');
    }

    // Create Pub/Sub Subscription
    await createProductPublishSubscription(apiRoot, topicName as string, projectId as string);
    logger.info('Product publish subscription created successfully.');

    // Log Algolia index details (for verification)
    logger.info('Algolia Index initialized:', algoliaIndex.indexName);

  } catch (error) {
    logger.error('Post-deploy process failed:', error);
    throw error;
  }
};
