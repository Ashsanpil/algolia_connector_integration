import { getProductById, getProductTypeById, getCategoryNamesByIds } from '../repository/product.repository';
import { ProductNotFoundError } from '../errors/custom.errors.extended';

/**
 * Create an Algolia record from commercetools product data.
 */
export const createAlgoliaRecord = async (productId: string) => {
  const product = await getProductById(productId);

  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  const productType = await getProductTypeById(product.productType.id);
  const categoryNames = await getCategoryNamesByIds(product.masterData.current.categories.map((cat) => cat.id));

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
