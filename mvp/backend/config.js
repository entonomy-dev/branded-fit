/**
 * Branded Fit MVP - Configuration Module
 * Centralizes all environment variables and configuration settings
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development',
  },

  // Logo Retrieval APIs
  brandfetch: {
    apiKey: process.env.BRANDFETCH_API_KEY,
    baseUrl: 'https://api.brandfetch.io/v2',
  },

  clearbit: {
    apiKey: process.env.CLEARBIT_API_KEY,
    baseUrl: 'https://logo.clearbit.com',
  },

  // Printify API
  printify: {
    apiKey: process.env.PRINTIFY_API_KEY,
    shopId: process.env.PRINTIFY_SHOP_ID,
    baseUrl: 'https://api.printify.com/v1',
    // Default t-shirt product blueprint ID (Bella+Canvas 3001 Unisex)
    defaultBlueprintId: 3,
    defaultPrintProviderId: 99, // Generic provider
  },

  // Shopify API
  shopify: {
    storeUrl: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
    get baseUrl() {
      return `https://${this.storeUrl}/admin/api/${this.apiVersion}`;
    },
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD_SECONDS) || 600,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Validation function
  validate() {
    const required = [
      'BRANDFETCH_API_KEY',
      'PRINTIFY_API_KEY',
      'PRINTIFY_SHOP_ID',
      'SHOPIFY_STORE_URL',
      'SHOPIFY_ACCESS_TOKEN',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please copy .env.example to .env and fill in your API keys.'
      );
    }
  },
};

module.exports = config;
