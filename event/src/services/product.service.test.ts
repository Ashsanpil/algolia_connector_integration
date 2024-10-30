// event/src/services/product.service.test.ts

// Mock environment variables
process.env.CTP_CLIENT_ID = 'test_client_id';
process.env.CTP_CLIENT_SECRET = 'test_client_secret';
process.env.CTP_PROJECT_KEY = 'test_project_key';
process.env.CTP_SCOPE = 'test_scope';
process.env.CTP_REGION = 'test_region';
process.env.ALGOLIA_APP_ID = 'test_algolia_app_id';
process.env.ALGOLIA_WRITE_API_KEY = 'test_algolia_write_api_key';

// Mock readConfiguration function to bypass .env validation
jest.mock('../utils/config.utils', () => ({
  ...jest.requireActual('../utils/config.utils'),
  readConfiguration: jest.fn().mockReturnValue({}),
}));

import { createAlgoliaRecord } from '../services/product.service';
import { getProductById, getProductTypeById, getCategoryNamesByIds } from '../repository/product.repository';
import { ProductNotFoundError } from '../errors/custom.errors.extended';

jest.mock('../repository/product.repository');

describe('Product Service', () => {
  const mockGetProductById = getProductById as jest.Mock;
  const mockGetProductTypeById = getProductTypeById as jest.Mock;
  const mockGetCategoryNamesByIds = getCategoryNamesByIds as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an Algolia record for a valid product', async () => {
    const mockProduct = {
      id: 'product123',
      key: 'prodKey123',
      productType: { id: 'type123' },
      masterData: {
        current: {
          name: { en: 'Test Product' },
          description: { en: 'Product Description' },
          categories: [{ id: 'cat1' }, { id: 'cat2' }],
          variants: [
            { id: 'variant1', sku: 'sku1', prices: [], attributes: [] },
          ],
          masterVariant: {
            id: 'masterVariant1',
            sku: 'masterSku',
            prices: [],
            attributes: [],
          },
        },
      },
    };
    const mockProductType = { id: 'type123', name: 'Type Name' };
    const mockCategoryNames = ['Category 1', 'Category 2'];

    mockGetProductById.mockResolvedValue(mockProduct);
    mockGetProductTypeById.mockResolvedValue(mockProductType);
    mockGetCategoryNamesByIds.mockResolvedValue(mockCategoryNames);

    const algoliaRecord = await createAlgoliaRecord('product123');

    expect(algoliaRecord).toEqual({
      objectID: 'product123',
      productKey: 'prodKey123',
      productType: 'Type Name',
      name: { en: 'Test Product' },
      description: { en: 'Product Description' },
      categories: ['Category 1', 'Category 2'],
      variants: [
        {
          id: 'variant1',
          sku: 'sku1',
          prices: [],
          attributes: [],
        },
      ],
      masterVariant: {
        id: 'masterVariant1',
        sku: 'masterSku',
        prices: [],
        attributes: [],
      },
    });
    expect(mockGetProductById).toHaveBeenCalledWith('product123');
    expect(mockGetProductTypeById).toHaveBeenCalledWith('type123');
    expect(mockGetCategoryNamesByIds).toHaveBeenCalledWith(['cat1', 'cat2']);
  });

  it('should throw ProductNotFoundError if product does not exist', async () => {
    mockGetProductById.mockResolvedValue(null);

    await expect(createAlgoliaRecord('invalidId')).rejects.toThrow(
      ProductNotFoundError
    );
    expect(mockGetProductById).toHaveBeenCalledWith('invalidId');
  });
});
