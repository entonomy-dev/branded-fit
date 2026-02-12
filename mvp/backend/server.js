/**
 * Branded Fit MVP - Express API Server
 * Main entry point for the backend API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const workflowService = require('./services/workflowService');

// Validate configuration before starting
try {
  config.validate();
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  console.error('\n❌ Configuration Error:\n', error.message, '\n');
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Branded Fit MVP',
    version: '1.0.0',
    description: 'Automated corporate apparel creation API',
    endpoints: {
      health: 'GET /health',
      info: 'GET /api/info',
      createProduct: 'POST /api/products/create',
    },
  });
});

/**
 * POST /api/products/create
 * Main endpoint to create branded product from company name
 *
 * Request body:
 * {
 *   "companyName": "Microsoft"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "companyName": "Microsoft",
 *     "shopifyProduct": {
 *       "id": "123456",
 *       "title": "Microsoft Branded T-Shirt",
 *       "handle": "microsoft-branded-t-shirt",
 *       "url": "https://your-store.myshopify.com/products/microsoft-branded-t-shirt"
 *     },
 *     "printifyProduct": {
 *       "id": "abc123",
 *       "title": "Microsoft Branded T-Shirt"
 *     },
 *     "duration": 45123
 *   }
 * }
 */
app.post('/api/products/create', async (req, res) => {
  try {
    const { companyName } = req.body;

    // Validate input
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: companyName is required and must be a non-empty string',
      });
    }

    logger.info('Received product creation request', { companyName });

    // Execute workflow
    const result = await workflowService.executeWorkflow(companyName);

    // Return success response
    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    logger.error('Product creation failed', {
      error: error.message,
      stack: error.stack,
    });

    // Return error response
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: config.server.env === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/products/create-stream (Server-Sent Events)
 * Create product with real-time progress updates
 *
 * This endpoint streams progress updates as the workflow executes
 */
app.post('/api/products/create-stream', async (req, res) => {
  try {
    const { companyName } = req.body;

    // Validate input
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: companyName is required',
      });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logger.info('Received streaming product creation request', { companyName });

    // Progress callback to send updates
    const sendProgress = (status) => {
      res.write(`data: ${JSON.stringify(status)}\n\n`);
    };

    // Execute workflow with progress updates
    const result = await workflowService.executeWorkflow(companyName, sendProgress);

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();

  } catch (error) {
    logger.error('Streaming product creation failed', {
      error: error.message,
    });

    // Send error event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message,
    })}\n\n`);
    res.end();
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: config.server.env === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`Branded Fit MVP server started`, {
    port: PORT,
    env: config.server.env,
    timestamp: new Date().toISOString(),
  });

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🎯 Branded Fit MVP Server Running              ║
║                                                           ║
║   Port: ${PORT}                                            ║
║   Environment: ${config.server.env}                              ║
║                                                           ║
║   API Endpoints:                                          ║
║   - GET  /health                                          ║
║   - GET  /api/info                                        ║
║   - POST /api/products/create                             ║
║   - POST /api/products/create-stream                      ║
║                                                           ║
║   Ready to create branded apparel! 🚀                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
