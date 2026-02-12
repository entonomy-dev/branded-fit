/**
 * Branded Fit MVP - Workflow Orchestration Service
 * Orchestrates the end-to-end automated product creation workflow
 */

const logoService = require('./logoService');
const printifyService = require('./printifyService');
const shopifyService = require('./shopifyService');
const logger = require('../logger');

/**
 * Workflow status tracker
 */
class WorkflowTracker {
  constructor(companyName) {
    this.companyName = companyName;
    this.startTime = Date.now();
    this.steps = {
      logoRetrieval: { status: 'pending', startTime: null, endTime: null, data: null },
      logoDownload: { status: 'pending', startTime: null, endTime: null, data: null },
      imageUpload: { status: 'pending', startTime: null, endTime: null, data: null },
      productCreation: { status: 'pending', startTime: null, endTime: null, data: null },
      productPublish: { status: 'pending', startTime: null, endTime: null, data: null },
      shopifyCreation: { status: 'pending', startTime: null, endTime: null, data: null },
    };
    this.error = null;
    this.result = null;
  }

  startStep(stepName) {
    this.steps[stepName].status = 'in_progress';
    this.steps[stepName].startTime = Date.now();
    logger.info(`Workflow step started: ${stepName}`, {
      companyName: this.companyName,
      step: stepName,
    });
  }

  completeStep(stepName, data = null) {
    this.steps[stepName].status = 'completed';
    this.steps[stepName].endTime = Date.now();
    this.steps[stepName].data = data;

    const duration = this.steps[stepName].endTime - this.steps[stepName].startTime;
    logger.info(`Workflow step completed: ${stepName}`, {
      companyName: this.companyName,
      step: stepName,
      duration: `${duration}ms`,
    });
  }

  failStep(stepName, error) {
    this.steps[stepName].status = 'failed';
    this.steps[stepName].endTime = Date.now();
    this.error = error;

    logger.error(`Workflow step failed: ${stepName}`, {
      companyName: this.companyName,
      step: stepName,
      error: error.message,
    });
  }

  getStatus() {
    const totalDuration = Date.now() - this.startTime;
    const completedSteps = Object.values(this.steps).filter(s => s.status === 'completed').length;
    const totalSteps = Object.keys(this.steps).length;

    return {
      companyName: this.companyName,
      startTime: this.startTime,
      totalDuration: `${totalDuration}ms`,
      progress: {
        completed: completedSteps,
        total: totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
      },
      steps: this.steps,
      error: this.error,
      result: this.result,
    };
  }
}

/**
 * Execute complete automated workflow
 * @param {string} companyName - Company name to create product for
 * @param {function} progressCallback - Optional callback for progress updates
 * @returns {Promise<object>} Workflow result with Shopify product URL
 */
async function executeWorkflow(companyName, progressCallback = null) {
  const tracker = new WorkflowTracker(companyName);

  try {
    logger.info('Starting automated workflow', { companyName });

    // Send initial progress update
    if (progressCallback) {
      progressCallback(tracker.getStatus());
    }

    // Step 1: Retrieve company logo
    tracker.startStep('logoRetrieval');
    const logoData = await logoService.getLogo(companyName);
    tracker.completeStep('logoRetrieval', { url: logoData.url, source: logoData.source });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Step 2: Download logo image
    tracker.startStep('logoDownload');
    const logoBuffer = await logoService.downloadLogo(logoData.url);
    tracker.completeStep('logoDownload', { size: logoBuffer.length });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Step 3: Upload image to Printify
    tracker.startStep('imageUpload');
    const imageId = await printifyService.uploadImage(
      logoBuffer,
      `${companyName.replace(/\s+/g, '-').toLowerCase()}-logo.png`
    );
    tracker.completeStep('imageUpload', { imageId });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Step 4: Create product on Printify
    tracker.startStep('productCreation');
    const printifyProduct = await printifyService.createProduct({
      companyName,
      imageId,
    });
    tracker.completeStep('productCreation', {
      productId: printifyProduct.id,
      title: printifyProduct.title,
    });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Step 5: Publish product on Printify
    tracker.startStep('productPublish');
    await printifyService.publishProduct(printifyProduct.id);

    // Get updated product with images
    const publishedProduct = await printifyService.getProduct(printifyProduct.id);
    tracker.completeStep('productPublish', {
      productId: publishedProduct.id,
      images: publishedProduct.images?.length || 0,
    });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Step 6: Create product on Shopify
    tracker.startStep('shopifyCreation');
    const shopifyProduct = await shopifyService.createProductFromPrintify(
      publishedProduct,
      companyName
    );
    tracker.completeStep('shopifyCreation', {
      productId: shopifyProduct.id,
      handle: shopifyProduct.handle,
      publicUrl: shopifyProduct.publicUrl,
    });
    if (progressCallback) progressCallback(tracker.getStatus());

    // Workflow complete
    const totalDuration = Date.now() - tracker.startTime;
    tracker.result = {
      success: true,
      companyName,
      shopifyProduct: {
        id: shopifyProduct.id,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        url: shopifyProduct.publicUrl,
      },
      printifyProduct: {
        id: publishedProduct.id,
        title: publishedProduct.title,
      },
      duration: totalDuration,
    };

    logger.info('Workflow completed successfully', {
      companyName,
      duration: `${totalDuration}ms`,
      shopifyUrl: shopifyProduct.publicUrl,
    });

    return tracker.result;

  } catch (error) {
    // Find which step failed
    const failedStep = Object.keys(tracker.steps).find(
      step => tracker.steps[step].status === 'in_progress'
    );

    if (failedStep) {
      tracker.failStep(failedStep, error);
    }

    logger.error('Workflow failed', {
      companyName,
      failedStep,
      error: error.message,
      stack: error.stack,
    });

    tracker.result = {
      success: false,
      companyName,
      error: error.message,
      failedStep,
      duration: Date.now() - tracker.startTime,
    };

    throw error;
  }
}

/**
 * Get workflow status by company name (for polling)
 * Note: This is a simplified version. In production, you'd store
 * workflow state in a database and retrieve it here.
 *
 * @param {string} workflowId - Workflow identifier
 * @returns {Promise<object>} Workflow status
 */
async function getWorkflowStatus(workflowId) {
  // TODO: Implement status tracking with database
  // For MVP, workflows are synchronous, so this is not needed
  throw new Error('Workflow status tracking not implemented in MVP');
}

module.exports = {
  executeWorkflow,
  getWorkflowStatus,
  WorkflowTracker,
};
