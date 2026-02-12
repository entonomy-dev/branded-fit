/**
 * Branded Fit MVP - Shopify Integration Service
 * Handles product creation and listing on Shopify store
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../logger');

/**
 * Create Shopify API client
 */
const shopifyClient = axios.create({
  baseURL: config.shopify.baseUrl,
  headers: {
    'X-Shopify-Access-Token': config.shopify.accessToken,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Create a product on Shopify
 * @param {object} params - Product creation parameters
 * @param {string} params.title - Product title
 * @param {string} params.description - Product description
 * @param {string} params.vendor - Vendor name (company name)
 * @param {array} params.images - Array of image URLs
 * @param {array} params.variants - Array of product variants
 * @param {array} params.tags - Product tags
 * @returns {Promise<object>} Created product data
 */
async function createProduct({
  title,
  description,
  vendor,
  images = [],
  variants = [],
  tags = [],
}) {
  try {
    logger.info('Creating product on Shopify', { title, vendor });

    const productData = {
      product: {
        title,
        body_html: description,
        vendor,
        product_type: 'Apparel',
        tags: tags.join(', '),
        images: images.map(url => ({ src: url })),
        variants: variants.map(v => ({
          option1: v.size || 'One Size',
          option2: v.color || 'Default',
          price: (v.price / 100).toFixed(2), // Convert cents to dollars
          sku: v.sku || `${vendor.toUpperCase()}-${Date.now()}`,
          inventory_management: null, // Printify handles fulfillment
          fulfillment_service: 'manual',
        })),
        options: [
          {
            name: 'Size',
            values: [...new Set(variants.map(v => v.size || 'One Size'))],
          },
          {
            name: 'Color',
            values: [...new Set(variants.map(v => v.color || 'Default'))],
          },
        ],
        published: true,
        status: 'active',
      },
    };

    const response = await shopifyClient.post('/products.json', productData);

    const product = response.data.product;
    logger.info('Product created successfully on Shopify', {
      productId: product.id,
      title: product.title,
      handle: product.handle,
    });

    return product;
  } catch (error) {
    logger.error('Failed to create product on Shopify', {
      title,
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(`Failed to create product on Shopify: ${error.message}`);
  }
}

/**
 * Get product details from Shopify
 * @param {string} productId - Shopify product ID
 * @returns {Promise<object>} Product data
 */
async function getProduct(productId) {
  try {
    logger.info('Fetching product from Shopify', { productId });

    const response = await shopifyClient.get(`/products/${productId}.json`);

    return response.data.product;
  } catch (error) {
    logger.error('Failed to fetch product from Shopify', {
      productId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Update product on Shopify
 * @param {string} productId - Shopify product ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated product data
 */
async function updateProduct(productId, updates) {
  try {
    logger.info('Updating product on Shopify', { productId, updates });

    const response = await shopifyClient.put(`/products/${productId}.json`, {
      product: updates,
    });

    logger.info('Product updated successfully on Shopify', { productId });

    return response.data.product;
  } catch (error) {
    logger.error('Failed to update product on Shopify', {
      productId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Generate public product URL
 * @param {string} handle - Product handle (slug)
 * @returns {string} Public product URL
 */
function getProductUrl(handle) {
  const storeUrl = config.shopify.storeUrl.replace('.myshopify.com', '');
  return `https://${storeUrl}.myshopify.com/products/${handle}`;
}

/**
 * Create product from Printify data
 * @param {object} printifyProduct - Printify product data
 * @param {string} companyName - Company name
 * @returns {Promise<object>} Shopify product data with public URL
 */
async function createProductFromPrintify(printifyProduct, companyName) {
  try {
    logger.info('Creating Shopify product from Printify data', {
      printifyProductId: printifyProduct.id,
      companyName,
    });

    // Extract image URLs from Printify product
    const images = printifyProduct.images || [];

    // Map Printify variants to Shopify format
    const variants = (printifyProduct.variants || []).map(v => {
      // Parse variant title (e.g., "Medium / White")
      const titleParts = v.title.split('/').map(s => s.trim());

      return {
        size: titleParts[0] || 'One Size',
        color: titleParts[1] || 'Default',
        price: v.price || 2500, // Price in cents
        sku: v.sku,
      };
    });

    // Create product on Shopify
    const shopifyProduct = await createProduct({
      title: printifyProduct.title,
      description: printifyProduct.description,
      vendor: companyName,
      images: images.map(img => img.src),
      variants,
      tags: ['branded', 'corporate', companyName.toLowerCase()],
    });

    // Generate public URL
    const publicUrl = getProductUrl(shopifyProduct.handle);

    return {
      ...shopifyProduct,
      publicUrl,
    };
  } catch (error) {
    logger.error('Failed to create Shopify product from Printify', {
      printifyProductId: printifyProduct.id,
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  getProductUrl,
  createProductFromPrintify,
};
