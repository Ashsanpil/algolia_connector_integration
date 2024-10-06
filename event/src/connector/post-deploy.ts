import { createApiRoot } from '../client/create.client';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { logger } from '../utils/logger.utils';
import algoliasearch from 'algoliasearch'; // Importing the default package
import { createProductPublishSubscription } from './actions';

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_WRITE_API_KEY || ''
);

// Initialize the index
const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || '');

export const postDeploy = async (topicName: string, projectId: string) => {
  const apiRoot = createApiRoot(); // Assuming you have this function defined in your client module
  await createProductPublishSubscription(apiRoot, topicName, projectId);
  logger.info('Product publish subscription created successfully.');
};
