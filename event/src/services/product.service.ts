import { getProductById, getProductTypeById, getCategoryNamesByIds } from '../repositories/product.repository';

/**
 * Create an Algolia record from commercetools product data.
 */
export const createAlgoliaRecord = async (productId: string) => {
  // Fetch product details
  const product = await getProductById(productId);

  // Fetch product type name using the productTypeId
  const productType = await getProductTypeById(product.productType.id);

  // Fetch category names using category IDs
  const categoryNames = await getCategoryNamesByIds(product.masterData.current.categories.map((cat) => cat.id));

  // Create an Algolia record from the product data
  const algoliaRecord = {
    objectID: product.id,
    productKey: product.key,
    productType: productType.name,
    name: product.masterData.current.name,
    description: product.masterData.current.description,
    categories: categoryNames,
    variants: product.masterData.current.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      prices: variant.prices,
      attributes: variant.attributes,
    })),
    masterVariant: {
      id: product.masterData.current.masterVariant.id,
      sku: product.masterData.current.masterVariant.sku,
      prices: product.masterData.current.masterVariant.prices,
      attributes: product.masterData.current.masterVariant.attributes,
    },
  };

  return algoliaRecord;
};
