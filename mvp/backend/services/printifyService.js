/**
 * Branded Fit MVP - Printify Integration Service
 * Handles product creation and mockup generation via Printify API
 */

const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../logger');

/**
 * Create Printify API client
 */
const printifyClient = axios.create({
  baseURL: config.printify.baseUrl,
  headers: {
    'Authorization': `Bearer ${config.printify.apiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Upload logo image to Printify
 * @param {Buffer} imageBuffer - Logo image data
 * @param {string} fileName - Original filename
 * @returns {Promise<string>} Uploaded image ID
 */
async function uploadImage(imageBuffer, fileName) {
  try {
    logger.info('Uploading image to Printify', { fileName, size: imageBuffer.length });

    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: fileName,
      contentType: 'image/png',
    });

    const response = await printifyClient.post('/uploads/images.json', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const imageId = response.data.id;
    logger.info('Image uploaded successfully to Printify', { imageId, fileName });

    return imageId;
  } catch (error) {
    logger.error('Failed to upload image to Printify', {
      fileName,
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(`Failed to upload image to Printify: ${error.message}`);
  }
}

/**
 * Get available print providers for a blueprint
 * @param {number} blueprintId - Blueprint ID
 * @returns {Promise<array>} List of print providers
 */
async function getPrintProviders(blueprintId) {
  try {
    logger.info('Fetching print providers', { blueprintId });

    const response = await printifyClient.get(
      `/catalog/blueprints/${blueprintId}/print_providers.json`
    );

    logger.info('Print providers retrieved', {
      blueprintId,
      count: response.data.length,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch print providers', {
      blueprintId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get variants for a blueprint and print provider
 * @param {number} blueprintId - Blueprint ID
 * @param {number} printProviderId - Print provider ID
 * @returns {Promise<array>} List of variants (sizes, colors)
 */
async function getVariants(blueprintId, printProviderId) {
  try {
    logger.info('Fetching variants', { blueprintId, printProviderId });

    const response = await printifyClient.get(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
    );

    logger.info('Variants retrieved', {
      blueprintId,
      printProviderId,
      count: response.data.variants.length,
    });

    return response.data.variants;
  } catch (error) {
    logger.error('Failed to fetch variants', {
      blueprintId,
      printProviderId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Create a product with logo on Printify
 * @param {object} params - Product creation parameters
 * @param {string} params.companyName - Company name for product title
 * @param {string} params.imageId - Uploaded image ID from Printify
 * @param {number} params.blueprintId - Blueprint ID (default: 3 for t-shirt)
 * @param {number} params.printProviderId - Print provider ID
 * @returns {Promise<object>} Created product data
 */
async function createProduct({ companyName, imageId, blueprintId, printProviderId }) {
  try {
    const bpId = blueprintId || config.printify.defaultBlueprintId;
    const ppId = printProviderId || config.printify.defaultPrintProviderId;

    logger.info('Creating product on Printify', {
      companyName,
      imageId,
      blueprintId: bpId,
      printProviderId: ppId,
    });

    // Get available variants
    const variants = await getVariants(bpId, ppId);

    // Select common variants (Medium, Large, XL in White and Black)
    const selectedVariants = variants
      .filter(v => {
        const title = v.title.toLowerCase();
        return (
          (title.includes('medium') || title.includes('large') || title.includes('xl')) &&
          (title.includes('white') || title.includes('black'))
        );
      })
      .slice(0, 6) // Limit to 6 variants for MVP
      .map(v => ({
        id: v.id,
        price: 2500, // $25.00 in cents
        is_enabled: true,
      }));

    if (selectedVariants.length === 0) {
      // Fallback: use first 6 variants if filtering fails
      selectedVariants.push(
        ...variants.slice(0, 6).map(v => ({
          id: v.id,
          price: 2500,
          is_enabled: true,
        }))
      );
    }

    // Create product payload
    const productData = {
      title: `${companyName} Branded T-Shirt`,
      description: `Premium quality branded t-shirt featuring the ${companyName} logo. Perfect for team events, corporate gifts, or showing company pride.`,
      blueprint_id: bpId,
      print_provider_id: ppId,
      variants: selectedVariants,
      print_areas: [
        {
          variant_ids: selectedVariants.map(v => v.id),
          placeholders: [
            {
              position: 'front',
              images: [
                {
                  id: imageId,
                  x: 0.5, // Center horizontally
                  y: 0.5, // Center vertically
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await printifyClient.post(
      `/shops/${config.printify.shopId}/products.json`,
      productData
    );

    const product = response.data;
    logger.info('Product created successfully on Printify', {
      productId: product.id,
      title: product.title,
      variants: product.variants.length,
    });

    return product;
  } catch (error) {
    logger.error('Failed to create product on Printify', {
      companyName,
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(`Failed to create product on Printify: ${error.message}`);
  }
}

/**
 * Publish product to make it available for selling
 * @param {string} productId - Printify product ID
 * @returns {Promise<object>} Published product data
 */
async function publishProduct(productId) {
  try {
    logger.info('Publishing product on Printify', { productId });

    const response = await printifyClient.post(
      `/shops/${config.printify.shopId}/products/${productId}/publish.json`,
      {
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
      }
    );

    logger.info('Product published successfully', { productId });

    return response.data;
  } catch (error) {
    logger.error('Failed to publish product', {
      productId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get product details including mockup images
 * @param {string} productId - Printify product ID
 * @returns {Promise<object>} Product data with images
 */
async function getProduct(productId) {
  try {
    logger.info('Fetching product details', { productId });

    const response = await printifyClient.get(
      `/shops/${config.printify.shopId}/products/${productId}.json`
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch product', {
      productId,
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  uploadImage,
  createProduct,
  publishProduct,
  getProduct,
  getPrintProviders,
  getVariants,
};
