# Connector Installation Guide

## Overview

1. Prerequisitess
2. How to install

## Prerequisites

* A CommerceTools project set up with product entities configured.
* An Algolia account with access to the Search API.
* API credentials for Algolia (Application ID and API Key).

## How to Install

Before you begin, ensure you have the following:

### CommerceTools API Client

To deploy and use the Algolia connector, you need a dedicated API client. Create it by following these steps:

1. Navigate to **Settings > Developer Settings** in your CommerceTools project.
2. Click on **Create new API client** (top right corner) using the **Admin client scope** template.
3. Note down the following credentials:
   * **CTP\_CLIENT\_ID**: The unique identifier for your CommerceTools API client.
   * **CTP\_CLIENT\_SECRET**: The secret used for authenticating your API client.
   * **CTP\_PROJECT\_KEY**: The key for your CommerceTools project.
   * **CTP\_SCOPE**: The necessary scopes that define the permissions for your API client.

### Algolia Account

1. Create an account on [Algolia](https://www.algolia.com/).
2. Note down your Algolia credentials for deployment:
   * **ALGOLIA\_APP\_ID**: The application ID for your Algolia account.
   * **ALGOLIA\_WRITE\_API\_KEY**: The API key used for write operations to your Algolia index.
   * **ALGOLIA\_INDEX\_NAME**: The name of the index where your products will be stored.
   * **ALGOLIA\_INDEX\_CONFIG**: Defines the index configuration as a JSON object. This JSON specifies searchable attributes and attributes for faceting in your index to enable optimized product search and filtering.

     Example JSON format:

     ```{
     {
       "searchableAttributes": ["name.en-US", "description.en-US", "categories", "productType", "variants.sku"],
       "attributesForFaceting": ["categories.en", "description.en-US", "name.en-US", "productType", "variants.sku"]
     }
     ```

### Algolia Index Management

* **ALGOLIA\_INDEX\_NAME**: This defines the name of the index where your products will be stored. If the specified `ALGOLIA_INDEX_NAME` does not already exist in your Algolia account, a new index will be created automatically using the configuration specified in `ALGOLIA_INDEX_CONFIG`.
* **ALGOLIA\_INDEX\_CONFIG**: This JSON object provides the configuration settings for your Algolia index, such as searchable attributes and attributes for faceting. If the `ALGOLIA_INDEX_NAME` already exists in your Algolia account, the `ALGOLIA_INDEX_CONFIG` will update the existing index’s configuration to match the specified settings.

This approach ensures that the index is properly configured upon setup, whether it is newly created or already existing.
