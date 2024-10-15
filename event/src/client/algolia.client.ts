import algoliasearch from 'algoliasearch';

// Initialize the Algolia client
export const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_WRITE_API_KEY || ''
);

// Initialize the index
export const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || '');

/**
 * Save a record to the Algolia index.
 */
export const saveProductToAlgolia = async (algoliaRecord: any) => {
  await algoliaIndex.saveObject(algoliaRecord);
};
