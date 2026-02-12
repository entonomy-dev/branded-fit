/**
 * Branded Fit MVP - Logo Retrieval Service
 * Handles automatic logo discovery via Brandfetch and Clearbit APIs
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('../logger');

// Initialize cache for logo URLs
const logoCache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkPeriod,
});

/**
 * Retrieve company logo using Brandfetch API
 * @param {string} companyName - Company name to search for
 * @returns {Promise<object>} Logo data with URL and metadata
 */
async function getLogoFromBrandfetch(companyName) {
  try {
    logger.info('Fetching logo from Brandfetch', { companyName });

    const response = await axios.get(
      `${config.brandfetch.baseUrl}/brands/${encodeURIComponent(companyName)}`,
      {
        headers: {
          'Authorization': `Bearer ${config.brandfetch.apiKey}`,
        },
        timeout: 10000,
      }
    );

    const brand = response.data;

    // Extract logo URL (prefer SVG, fallback to PNG)
    let logoUrl = null;
    if (brand.logos && brand.logos.length > 0) {
      const svgLogo = brand.logos.find(logo => logo.type === 'logo' && logo.formats?.find(f => f.format === 'svg'));
      const pngLogo = brand.logos.find(logo => logo.type === 'logo' && logo.formats?.find(f => f.format === 'png'));

      if (svgLogo && svgLogo.formats) {
        const svgFormat = svgLogo.formats.find(f => f.format === 'svg');
        logoUrl = svgFormat?.src;
      } else if (pngLogo && pngLogo.formats) {
        const pngFormat = pngLogo.formats.find(f => f.format === 'png');
        logoUrl = pngFormat?.src;
      }
    }

    if (!logoUrl) {
      throw new Error('No logo found in Brandfetch response');
    }

    logger.info('Logo retrieved successfully from Brandfetch', { companyName, logoUrl });

    return {
      url: logoUrl,
      source: 'brandfetch',
      companyName: brand.name || companyName,
      domain: brand.domain,
    };
  } catch (error) {
    logger.error('Brandfetch API error', { companyName, error: error.message });
    throw error;
  }
}

/**
 * Retrieve company logo using Clearbit API
 * @param {string} companyDomain - Company domain (e.g., microsoft.com)
 * @returns {Promise<object>} Logo data with URL
 */
async function getLogoFromClearbit(companyDomain) {
  try {
    logger.info('Fetching logo from Clearbit', { companyDomain });

    // Clearbit Logo API is simple: just construct the URL
    const logoUrl = `${config.clearbit.baseUrl}/${companyDomain}`;

    // Verify the logo exists with a HEAD request
    await axios.head(logoUrl, { timeout: 5000 });

    logger.info('Logo retrieved successfully from Clearbit', { companyDomain, logoUrl });

    return {
      url: logoUrl,
      source: 'clearbit',
      domain: companyDomain,
    };
  } catch (error) {
    logger.error('Clearbit API error', { companyDomain, error: error.message });
    throw error;
  }
}

/**
 * Main function to retrieve company logo with fallback strategy
 * @param {string} companyName - Company name or domain
 * @returns {Promise<object>} Logo data
 */
async function getLogo(companyName) {
  // Check cache first
  const cacheKey = companyName.toLowerCase();
  const cachedLogo = logoCache.get(cacheKey);

  if (cachedLogo) {
    logger.info('Logo retrieved from cache', { companyName });
    return cachedLogo;
  }

  let logo = null;
  const errors = [];

  // Try Brandfetch first (more comprehensive)
  if (config.brandfetch.apiKey) {
    try {
      logo = await getLogoFromBrandfetch(companyName);
      logoCache.set(cacheKey, logo);
      return logo;
    } catch (error) {
      errors.push({ source: 'brandfetch', error: error.message });
    }
  }

  // Fallback to Clearbit (requires domain)
  if (config.clearbit.apiKey && companyName.includes('.')) {
    try {
      logo = await getLogoFromClearbit(companyName);
      logoCache.set(cacheKey, logo);
      return logo;
    } catch (error) {
      errors.push({ source: 'clearbit', error: error.message });
    }
  }

  // If no logo found, throw error with details
  logger.error('Failed to retrieve logo from all sources', { companyName, errors });
  throw new Error(
    `Could not retrieve logo for "${companyName}". ` +
    `Tried: ${errors.map(e => e.source).join(', ')}. ` +
    `Errors: ${errors.map(e => e.error).join('; ')}`
  );
}

/**
 * Download logo image as buffer
 * @param {string} logoUrl - URL of the logo image
 * @returns {Promise<Buffer>} Image data as buffer
 */
async function downloadLogo(logoUrl) {
  try {
    logger.info('Downloading logo image', { logoUrl });

    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    logger.info('Logo downloaded successfully', {
      logoUrl,
      size: response.data.length,
      contentType: response.headers['content-type'],
    });

    return Buffer.from(response.data);
  } catch (error) {
    logger.error('Failed to download logo', { logoUrl, error: error.message });
    throw new Error(`Failed to download logo from ${logoUrl}: ${error.message}`);
  }
}

module.exports = {
  getLogo,
  downloadLogo,
  getLogoFromBrandfetch,
  getLogoFromClearbit,
};
