import { createApiRoot } from '../client/create.client';

/**
 * Fetch product details by ID from commercetools.
 */
export const getProductById = async (productId: string) => {
  const { body: product } = await createApiRoot().products().withId({ ID: productId }).get().execute();
  return product;
};

/**
 * Fetch product type details by ID from commercetools.
 */
export const getProductTypeById = async (productTypeId: string) => {
  const { body: productType } = await createApiRoot().productTypes().withId({ ID: productTypeId }).get().execute();
  return productType;
};

/**
 * Fetch category names by their IDs from commercetools.
 */
export const getCategoryNamesByIds = async (categoryIds: string[]) => {
  const categoryNames = await Promise.all(
    categoryIds.map(async (categoryId) => {
      const { body: category } = await createApiRoot().categories().withId({ ID: categoryId }).get().execute();
      return category.name;
    })
  );
  return categoryNames;
};
