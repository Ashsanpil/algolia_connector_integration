import algoliasearch, { SearchClient } from 'algoliasearch';
import { ensureIndexExists, saveProductToAlgolia, removeProductFromAlgolia } from './algolia.client';
import { logger } from '../utils/logger.utils';

// Create a mock implementation of the Algolia client
const mockInitIndex = jest.fn().mockReturnValue({
  getSettings: jest.fn(),
  setSettings: jest.fn(),
  saveObject: jest.fn(),
  deleteObject: jest.fn(),
});

// Mock the Algolia client before using it
jest.mock('algoliasearch', () => {
  return jest.fn(() => ({
    initIndex: jest.fn(() => mockInitIndex()),
  }));
});

// Mock the logger
jest.mock('../utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('Algolia Client Tests', () => {
  const mockIndexName = 'test_index';
  const mockAppId = 'test_app_id';
  const mockApiKey = 'test_api_key';
  const mockIndexConfig = JSON.stringify({ searchableAttributes: ['name'] });

  beforeAll(() => {
    // Set environment variables for testing
    process.env.ALGOLIA_INDEX_NAME = mockIndexName;
    process.env.ALGOLIA_APP_ID = mockAppId;
    process.env.ALGOLIA_WRITE_API_KEY = mockApiKey;
    process.env.ALGOLIA_INDEX_CONFIG = mockIndexConfig;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous calls to mocks
  });

  test('ensureIndexExists should create index if it does not exist', async () => {
    const index = mockInitIndex();
    index.getSettings.mockRejectedValueOnce({ status: 404 }); // Simulate index not found

    await ensureIndexExists();

    expect(index.setSettings).toHaveBeenCalledWith(JSON.parse(mockIndexConfig));
    expect(logger.info).toHaveBeenCalledWith(`Index ${mockIndexName} created with configuration:`, JSON.parse(mockIndexConfig));
  });

  test('ensureIndexExists should not create index if it already exists', async () => {
    const index = mockInitIndex();
    index.getSettings.mockResolvedValueOnce({}); // Simulate index exists

    await ensureIndexExists();

    expect(index.setSettings).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(`Index ${mockIndexName} already exists. No changes to configuration.`);
  });

  test('saveProductToAlgolia should save a product to Algolia', async () => {
    const mockRecord = { id: 'product-1', name: 'Test Product' };
    const index = mockInitIndex();

    await saveProductToAlgolia(mockRecord);

    expect(index.saveObject).toHaveBeenCalledWith(mockRecord);
  });

  test('removeProductFromAlgolia should remove a product from Algolia', async () => {
    const productId = 'product-1';
    const index = mockInitIndex();

    await removeProductFromAlgolia(productId);

    expect(index.deleteObject).toHaveBeenCalledWith(productId);
    expect(logger.info).toHaveBeenCalledWith(`Product with ID ${productId} removed from Algolia index.`);
  });

  test('ensureIndexExists should throw an error for unexpected errors', async () => {
    const index = mockInitIndex();
    index.getSettings.mockRejectedValueOnce({ status: 500 }); // Simulate unexpected error

    await expect(ensureIndexExists()).rejects.toThrow();
  });
});
