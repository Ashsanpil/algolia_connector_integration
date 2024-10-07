import {
  Destination,
  GoogleCloudPubSubDestination,
} from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import algoliasearch, { SearchClient } from 'algoliasearch'; // Algolia integration

const ORDER_SUBSCRIPTION_KEY = 'myconnector-orderSubscription';
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

// Function to create order subscription for Pub/Sub
export async function createGcpPubSubOrderSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  const destination: GoogleCloudPubSubDestination = {
    type: 'GoogleCloudPubSub',
    topic: topicName,
    projectId,
  };
  await createSubscription(apiRoot, destination, ORDER_SUBSCRIPTION_KEY, 'order', 'OrderStateChanged');
}

// Function to create product publish subscription for Algolia
export async function createProductPublishSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  const destination: GoogleCloudPubSubDestination = {
    type: 'GoogleCloudPubSub',
    topic: topicName,
    projectId,
  };
  await createSubscription(apiRoot, destination, PRODUCT_PUBLISH_SUBSCRIPTION_KEY, 'product', 'ProductPublished');
}

// Reusable function to create subscriptions
async function createSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  destination: Destination,
  subscriptionKey: string,
  resourceTypeId: string,
  messageType: string
) {
  await deleteSubscription(apiRoot, subscriptionKey);
  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: subscriptionKey,
        destination,
        messages: [
          {
            resourceTypeId,
            types: [messageType],
          },
        ],
      },
    })
    .execute();
}

// Function to delete a subscription by key
async function deleteSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  subscriptionKey: string
): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key="${subscriptionKey}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];
    await apiRoot
      .subscriptions()
      .withKey({ key: subscriptionKey })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }
}
