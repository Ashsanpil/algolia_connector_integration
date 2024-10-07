import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import algoliasearch, { SearchClient } from 'algoliasearch'; // Import Algolia client

const PRODUCT_PUBLISH_SUBSCRIPTION_KEY = 'myconnector-productPublishSubscription';

// Initialize Algolia client
const initAlgoliaClient = (): SearchClient => {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_WRITE_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('Algolia credentials not found in environment variables');
  }

  return algoliasearch(appId, apiKey);
};

// Function to create Pub/Sub Subscription for Product Publishing
export async function createProductPublishSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  const { body: { results: subscriptions } } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key="${PRODUCT_PUBLISH_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];
    await apiRoot
      .subscriptions()
      .withKey({ key: PRODUCT_PUBLISH_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }

  // Create the new subscription
  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: PRODUCT_PUBLISH_SUBSCRIPTION_KEY,
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
        messages: [
          {
            resourceTypeId: 'product',
            types: ['ProductPublished'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteProductPublishSubscription(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const { body: { results: subscriptions } } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key="${PRODUCT_PUBLISH_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];
    await apiRoot
      .subscriptions()
      .withKey({ key: PRODUCT_PUBLISH_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }
}
