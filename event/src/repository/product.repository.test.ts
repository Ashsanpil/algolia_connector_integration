import { getProductById, getProductTypeById, getCategoryNamesByIds } from '../repository/product.repository';

// Mock the createApiRoot function
jest.mock('../client/create.client', () => ({
  createApiRoot: jest.fn(() => ({
    products: jest.fn(() => ({
      withId: jest.fn(({ ID }: { ID: string }) => ({
        get: jest.fn(() => ({
          execute: jest.fn(() => Promise.resolve({ body: { id: ID, name: 'Test Product' } })),
        })),
      })),
    })),
    productTypes: jest.fn(() => ({
      withId: jest.fn(({ ID }: { ID: string }) => ({
        get: jest.fn(() => ({
          execute: jest.fn(() => Promise.resolve({ body: { id: ID, name: 'Test Product Type' } })),
        })),
      })),
    })),
    categories: jest.fn(() => ({
      withId: jest.fn(({ ID }: { ID: string }) => ({
        get: jest.fn(() => ({
          execute: jest.fn(() => Promise.resolve({ body: { id: ID, name: 'Test Category' } })),
        })),
      })),
    })),
  })),
}));

describe('Product Repository', () => {
  describe('getProductById', () => {
    it('should fetch product details by ID', async () => {
      const productId = '123';
      const product = await getProductById(productId);
      expect(product).toEqual({ id: productId, name: 'Test Product' });
    });
  });

  describe('getProductTypeById', () => {
    it('should fetch product type details by ID', async () => {
      const productTypeId = '456';
      const productType = await getProductTypeById(productTypeId);
      expect(productType).toEqual({ id: productTypeId, name: 'Test Product Type' });
    });
  });

  describe('getCategoryNamesByIds', () => {
    it('should fetch category names by IDs', async () => {
      const categoryIds = ['789', '101'];
      const categoryNames = await getCategoryNamesByIds(categoryIds);
      expect(categoryNames).toEqual(['Test Category', 'Test Category']); // Adjust expected output based on how your mock works
    });
  });
});
