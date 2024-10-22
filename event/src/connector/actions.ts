import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { GoogleCloudPubSubDestination } from '@commercetools/platform-sdk';

const PRODUCT_PUBLISH_SUBSCRIPTION_KEY = 'myconnector-productPublishSubscription';

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

  await deleteSubscription(apiRoot, PRODUCT_PUBLISH_SUBSCRIPTION_KEY);

  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: PRODUCT_PUBLISH_SUBSCRIPTION_KEY,
        destination,
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

export async function deleteSubscription(
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
