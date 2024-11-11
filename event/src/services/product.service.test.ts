
process.env.CTP_CLIENT_ID = 'test_client_id';
process.env.CTP_CLIENT_SECRET = 'test_client_secret';
process.env.CTP_PROJECT_KEY = 'test_project_key';
process.env.CTP_SCOPE = 'test_scope';
process.env.CTP_REGION = 'test_region';
process.env.ALGOLIA_APP_ID = 'test_algolia_app_id';
process.env.ALGOLIA_WRITE_API_KEY = 'test_algolia_write_api_key';

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

  describe('createAlgoliaRecord', () => {
    const baseMockProduct = {
      id: 'product123',
      key: 'prodKey123',
      productType: { id: 'type123' },
      masterData: {
        current: {
          name: { 'en-US': 'Test Product' },
          description: { 'en-US': 'Product Description' },
          categories: [{ id: 'cat1' }, { id: 'cat2' }],
          variants: [
            { 
              id: 'variant1', 
              sku: 'sku1', 
              prices: [{ value: { centAmount: 1000, currencyCode: 'USD' } }],
              attributes: [{ name: 'color', value: 'red' }] 
            },
          ],
          masterVariant: {
            id: 'masterVariant1',
            sku: 'masterSku',
            prices: [{ value: { centAmount: 2000, currencyCode: 'USD' } }],
            attributes: [{ name: 'size', value: 'M' }],
          },
        },
      },
    };

    it('should create an Algolia record for a valid product with all fields', async () => {
      const mockProductType = { id: 'type123', name: 'Type Name' };
      const mockCategoryNames = ['Category 1', 'Category 2'];

      mockGetProductById.mockResolvedValue(baseMockProduct);
      mockGetProductTypeById.mockResolvedValue(mockProductType);
      mockGetCategoryNamesByIds.mockResolvedValue(mockCategoryNames);

      const algoliaRecord = await createAlgoliaRecord('product123');

      expect(algoliaRecord).toEqual({
        objectID: 'product123',
        productKey: 'prodKey123',
        productType: 'Type Name',
        name: { 'en-US': 'Test Product' },
        description: { 'en-US': 'Product Description' },
        categories: ['Category 1', 'Category 2'],
        variants: [
          {
            id: 'variant1',
            sku: 'sku1',
            prices: [{ value: { centAmount: 1000, currencyCode: 'USD' } }],
            attributes: [{ name: 'color', value: 'red' }],
          },
        ],
        masterVariant: {
          id: 'masterVariant1',
          sku: 'masterSku',
          prices: [{ value: { centAmount: 2000, currencyCode: 'USD' } }],
          attributes: [{ name: 'size', value: 'M' }],
        },
      });
    });

    it('should handle product with no variants', async () => {
      const productWithNoVariants = {
        ...baseMockProduct,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            variants: [],
          },
        },
      };

      mockGetProductById.mockResolvedValue(productWithNoVariants);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue(['Category 1', 'Category 2']);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.variants).toEqual([]);
    });

    it('should handle product with missing optional fields', async () => {
      const productWithMissingFields = {
        ...baseMockProduct,
        key: undefined,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            description: undefined,
            categories: [],
          },
        },
      };

      mockGetProductById.mockResolvedValue(productWithMissingFields);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue([]);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.productKey).toBeUndefined();
      expect(algoliaRecord.description).toBeUndefined();
      expect(algoliaRecord.categories).toEqual([]);
    });

    it('should handle product with multiple language versions', async () => {
      const multiLanguageProduct = {
        ...baseMockProduct,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            name: { 'en-US': 'Test Product', 'de': 'Test Produkt' },
            description: { 'en-US': 'Description', 'de': 'Beschreibung' },
          },
        },
      };

      mockGetProductById.mockResolvedValue(multiLanguageProduct);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue(['Category 1']);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.name).toEqual({ 'en-US': 'Test Product', 'de': 'Test Produkt' });
      expect(algoliaRecord.description).toEqual({ 'en-US': 'Description', 'de': 'Beschreibung' });
    });

    it('should throw ProductNotFoundError if product does not exist', async () => {
      mockGetProductById.mockResolvedValue(null);

      await expect(createAlgoliaRecord('invalidId')).rejects.toThrow(
        ProductNotFoundError
      );
      expect(mockGetProductById).toHaveBeenCalledWith('invalidId');
    });

    it('should handle network errors from repository calls', async () => {
      mockGetProductById.mockRejectedValue(new Error('Network error'));

      await expect(createAlgoliaRecord('product123')).rejects.toThrow('Network error');
    });

    it('should handle missing product type', async () => {
      mockGetProductById.mockResolvedValue(baseMockProduct);
      mockGetProductTypeById.mockResolvedValue(null);

      await expect(createAlgoliaRecord('product123')).rejects.toThrow();
    });


    it('should handle empty category response', async () => {
      mockGetProductById.mockResolvedValue(baseMockProduct);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue([]);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.categories).toEqual([]);
    });

    it('should handle large number of variants', async () => {
      const productWithManyVariants = {
        ...baseMockProduct,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            variants: Array(100).fill({}).map((_, index) => ({
              id: `variant${index}`,
              sku: `sku${index}`,
              prices: [],
              attributes: [],
            })),
          },
        },
      };

      mockGetProductById.mockResolvedValue(productWithManyVariants);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue(['Category 1']);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.variants.length).toBe(100);
    });

    it('should handle product with complex attributes', async () => {
      const productWithComplexAttributes = {
        ...baseMockProduct,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            masterVariant: {
              ...baseMockProduct.masterData.current.masterVariant,
              attributes: [
                { name: 'color', value: { key: 'red', label: 'Red' } },
                { name: 'dimensions', value: { width: 10, height: 20, unit: 'cm' } },
                { name: 'tags', value: ['summer', 'sale'] },
              ],
            },
          },
        },
      };

      mockGetProductById.mockResolvedValue(productWithComplexAttributes);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue(['Category 1']);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.masterVariant.attributes).toEqual([
        { name: 'color', value: { key: 'red', label: 'Red' } },
        { name: 'dimensions', value: { width: 10, height: 20, unit: 'cm' } },
        { name: 'tags', value: ['summer', 'sale'] },
      ]);
    });

    it('should handle errors in getCategoryNamesByIds', async () => {
      mockGetProductById.mockResolvedValue(baseMockProduct);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockRejectedValue(new Error('Category fetch error'));

      await expect(createAlgoliaRecord('product123')).rejects.toThrow('Category fetch error');
    });

    it('should handle product with no prices', async () => {
      const productWithNoPrices = {
        ...baseMockProduct,
        masterData: {
          current: {
            ...baseMockProduct.masterData.current,
            masterVariant: {
              ...baseMockProduct.masterData.current.masterVariant,
              prices: [],
            },
            variants: [
              {
                ...baseMockProduct.masterData.current.variants[0],
                prices: [],
              },
            ],
          },
        },
      };

      mockGetProductById.mockResolvedValue(productWithNoPrices);
      mockGetProductTypeById.mockResolvedValue({ id: 'type123', name: 'Type Name' });
      mockGetCategoryNamesByIds.mockResolvedValue(['Category 1']);

      const algoliaRecord = await createAlgoliaRecord('product123');
      expect(algoliaRecord.masterVariant.prices).toEqual([]);
      expect(algoliaRecord.variants[0].prices).toEqual([]);
    });
  });
});