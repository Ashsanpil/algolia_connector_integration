import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertError } from '../utils/assert.utils';
import { deleteSubscription } from './actions';

const PRODUCT_PUBLISH_SUBSCRIPTION_KEY = 'myconnector-productPublishSubscription';

async function preUndeploy(): Promise<void> {
  const apiRoot = createApiRoot();
  await deleteSubscription(apiRoot, PRODUCT_PUBLISH_SUBSCRIPTION_KEY);
}

async function run(): Promise<void> {
  try {
    await preUndeploy();
  } catch (error) {
    assertError(error);
    process.stderr.write(`Pre-undeploy failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

run();
