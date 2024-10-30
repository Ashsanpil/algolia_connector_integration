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
   *
