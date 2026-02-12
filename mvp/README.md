# Branded Fit MVP

**Version:** 1.0.0
**Status:** Ready for Testing
**Date:** February 12, 2026

---

## Overview

Branded Fit MVP is an automated corporate apparel creation system that transforms a company name into a live, purchasable product page in under 60 seconds.

**Core Workflow:**
```
Company Name → Logo Retrieval → Product Mockup → Shopify Listing → Live Store
```

**Example:** Enter "Microsoft" → Get `https://your-store.myshopify.com/products/microsoft-branded-t-shirt`

---

## Features

✅ **Single-Input Interface** - Just enter a company name
✅ **Automated Logo Discovery** - Powered by Brandfetch API
✅ **Print-on-Demand Integration** - Printify handles manufacturing
✅ **Live E-commerce Listing** - Instant Shopify product page
✅ **Real-time Progress Tracking** - See each workflow step
✅ **Error Handling** - Clear error messages and recovery
✅ **Caching Layer** - Reduce API costs and improve speed

---

## Tech Stack

**Backend:**
- Node.js 18+ with Express.js
- Axios for HTTP requests
- Winston for logging
- Node-cache for in-memory caching

**Frontend:**
- React 18 with Vite
- Vanilla CSS (no framework dependencies)
- Axios for API calls

**External APIs:**
- Brandfetch - Logo retrieval
- Printify - Print-on-demand
- Shopify - E-commerce platform

---

## Quick Start

### Prerequisites

- Node.js 18+ installed ([nodejs.org](https://nodejs.org))
- npm or yarn package manager
- API keys for Brandfetch, Printify, Shopify (see [API Setup Guide](../docs/2026-02-12_api_integration_guide.md))

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/entonomy-dev/branded-fit.git
cd branded-fit/mvp
```

#### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
BRANDFETCH_API_KEY=your_key_here
PRINTIFY_API_KEY=your_key_here
PRINTIFY_SHOP_ID=your_shop_id
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_token_here
```

Start backend server:

```bash
npm start
```

Server runs on: http://localhost:8080

#### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

#### 4. Test the System

1. Open http://localhost:3000 in your browser
2. Enter a company name (e.g., "Microsoft")
3. Click "Create Branded Product"
4. Wait 30-60 seconds for completion
5. Click the Shopify link to view the live product

---

## Project Structure

```
mvp/
├── backend/                 # Node.js API server
│   ├── server.js           # Main Express server
│   ├── config.js           # Configuration management
│   ├── logger.js           # Winston logging setup
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   └── services/           # Service modules
│       ├── logoService.js      # Logo retrieval (Brandfetch)
│       ├── printifyService.js  # Printify integration
│       ├── shopifyService.js   # Shopify integration
│       └── workflowService.js  # Orchestration logic
│
├── frontend/               # React web application
│   ├── index.html         # Entry HTML
│   ├── package.json       # Dependencies
│   ├── vite.config.js     # Vite configuration
│   └── src/
│       ├── main.jsx       # React entry point
│       ├── App.jsx        # Main application component
│       └── index.css      # Styles
│
└── README.md              # This file
```

---

## API Endpoints

### Backend API (Port 8080)

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### `POST /api/products/create`
Create branded product from company name.

**Request:**
```json
{
  "companyName": "Microsoft"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "companyName": "Microsoft",
    "shopifyProduct": {
      "id": "123456789",
      "title": "Microsoft Branded T-Shirt",
      "handle": "microsoft-branded-t-shirt",
      "url": "https://store.myshopify.com/products/microsoft-branded-t-shirt"
    },
    "printifyProduct": {
      "id": "abc123",
      "title": "Microsoft Branded T-Shirt"
    },
    "duration": 45231
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Could not retrieve logo for 'UnknownCompany'"
}
```

---

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Backend server port | `8080` |
| `NODE_ENV` | No | Environment mode | `development` |
| `BRANDFETCH_API_KEY` | Yes | Brandfetch API key | `bf_abc123...` |
| `PRINTIFY_API_KEY` | Yes | Printify API token | `eyJ0eXAiOiJ...` |
| `PRINTIFY_SHOP_ID` | Yes | Printify shop ID | `123456` |
| `SHOPIFY_STORE_URL` | Yes | Shopify store domain | `store.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Yes | Shopify API token | `shpat_abc123...` |
| `SHOPIFY_API_VERSION` | No | API version | `2024-01` |
| `CACHE_TTL_SECONDS` | No | Cache duration | `3600` |
| `LOG_LEVEL` | No | Logging verbosity | `info` |

See [API Integration Guide](../docs/2026-02-12_api_integration_guide.md) for detailed setup instructions.

---

## Testing

### Manual Testing

**Test with these companies:**

✅ **Major Brands:** Microsoft, Apple, Tesla, Nike, Coca-Cola
✅ **Tech Companies:** GitHub.com, Stripe.com, Notion.so
✅ **Edge Cases:** 3M, A&W, BP (special characters)

### Automated Testing (Future)

```bash
cd backend
npm test
```

---

## Deployment

### Development (Local)

Already covered in Quick Start above.

### Production Deployment

#### Option 1: Platform-as-a-Service (Recommended for MVP)

**Backend - Render / Railway / Heroku:**

1. Create new web service
2. Connect GitHub repository
3. Set build command: `cd mvp/backend && npm install`
4. Set start command: `node server.js`
5. Add environment variables in dashboard
6. Deploy

**Frontend - Vercel / Netlify:**

1. Create new site
2. Connect GitHub repository
3. Set root directory: `mvp/frontend`
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Set environment variable: `VITE_API_URL=<backend-url>`
7. Deploy

#### Option 2: VPS (DigitalOcean, AWS EC2)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/entonomy-dev/branded-fit.git
cd branded-fit/mvp

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with production keys

# Install PM2 for process management
sudo npm install -g pm2
pm2 start server.js --name branded-fit-api
pm2 save
pm2 startup

# Setup frontend
cd ../frontend
npm install
npm run build

# Serve with Nginx
sudo apt install nginx
# Configure Nginx to serve dist/ folder
```

#### Option 3: Docker

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

```bash
docker build -t branded-fit-backend ./backend
docker run -p 8080:8080 --env-file .env branded-fit-backend
```

---

## Troubleshooting

### Common Issues

#### "Configuration validation failed"

**Cause:** Missing API keys in `.env`

**Solution:**
1. Verify all required variables are set
2. Check for typos in variable names
3. Ensure no extra spaces around values
4. Restart server after editing `.env`

#### "Could not retrieve logo"

**Cause:** Company not found in Brandfetch database

**Solution:**
1. Try with full domain: `microsoft.com` instead of `Microsoft`
2. Test with major brands first: Apple, Microsoft, Tesla
3. Check Brandfetch API quota (100/month free)
4. Verify API key is valid

#### "Printify authentication failed"

**Cause:** Invalid API token or shop ID

**Solution:**
1. Regenerate API token in Printify dashboard
2. Verify shop ID is numeric only
3. Ensure token has full permissions
4. Check token hasn't expired

#### "Port 8080 already in use"

**Cause:** Another process using port 8080

**Solution:**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9

# Or change port in .env
PORT=8081
```

### Logs

Backend logs are stored in:
- `backend/logs/combined.log` - All logs
- `backend/logs/error.log` - Errors only

View real-time logs:
```bash
tail -f backend/logs/combined.log
```

---

## Performance

### Expected Timings

| Step | Duration |
|------|----------|
| Logo retrieval | 5-10s |
| Logo download | 3-5s |
| Printify upload | 8-12s |
| Product creation | 10-15s |
| Product publish | 5-8s |
| Shopify listing | 8-12s |
| **Total** | **40-60s** |

### Optimization Tips

1. **Enable Caching** - Logos cached for 1 hour (default)
2. **Use Fast Network** - API calls are network-dependent
3. **Upgrade API Tiers** - Higher tiers have better rate limits
4. **Optimize Images** - Smaller logos upload faster

---

## API Costs

### Per Product Creation (Free Tiers)

- Brandfetch: 1 call (100/month free)
- Printify: 3 calls (unlimited free)
- Shopify: 1 call (unlimited free)

**Total: $0 per product** (within free limits)

### When Costs Occur

- **Brandfetch:** After 100 products/month → $29/mo for 1,000
- **Printify:** $0 until customer orders → $8-12 per shirt manufactured
- **Shopify:** $39/mo for store (after 14-day trial)

**Profit Model:** Sell at $25, cost $10 → $15 profit per shirt

---

## Security

### Best Practices

✅ Store API keys in `.env` (never commit)
✅ Add `.env` to `.gitignore`
✅ Use HTTPS in production
✅ Rotate API keys regularly
✅ Implement rate limiting
✅ Sanitize all user inputs
✅ Enable CORS only for trusted domains

### Security Headers

Backend uses Helmet.js for:
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
- Strict-Transport-Security (HTTPS only)

---

## Limitations

### Current MVP Limitations

1. **Single Product Type** - T-shirts only (Bella+Canvas 3001)
2. **Fixed Variants** - M, L, XL in White/Black only
3. **No Authentication** - Public access
4. **Synchronous Processing** - User waits for completion
5. **No Order Tracking** - Can't see sales/orders
6. **In-Memory Cache** - Lost on server restart

### Planned V2 Features

- Multiple product types (hoodies, mugs, hats)
- All sizes and colors
- User accounts and authentication
- Async job processing with status polling
- Order dashboard
- Persistent cache (Redis)
- Admin panel

---

## Documentation

- **[Architecture Overview](../docs/2026-02-12_mvp_architecture.md)** - System design and technical decisions
- **[API Integration Guide](../docs/2026-02-12_api_integration_guide.md)** - Detailed API setup instructions
- **[Technical Specification](../docs/2026-02-12_mvp_technical_specification.md)** - Complete technical spec

---

## Support

### Issues

Report bugs and feature requests:
[GitHub Issues](https://github.com/entonomy-dev/branded-fit/issues)

### Documentation

Full documentation in `docs/` directory:
- Market research
- Customer interviews
- Legal compliance
- Technical specifications

---

## License

Copyright © 2026 Branded Fit. All rights reserved.

---

## Authors

Developed by the Branded Fit team.

**Contributors:**
- Technical Lead - MVP implementation
- Market Researcher - Customer validation
- Legal Analyst - Compliance research

---

## Changelog

### Version 1.0.0 (2026-02-12)

**Initial Release:**
- ✅ Automated logo retrieval (Brandfetch)
- ✅ Print-on-demand integration (Printify)
- ✅ E-commerce listing (Shopify)
- ✅ React web interface
- ✅ Real-time progress tracking
- ✅ Error handling and logging
- ✅ Caching layer for API optimization

---

## Next Steps

1. ✅ Complete API setup (see API Integration Guide)
2. ✅ Test with 5-10 companies
3. ✅ Deploy to staging environment
4. ⏸️ Conduct user validation interviews
5. ⏸️ Gather feedback and iterate
6. ⏸️ Plan V2 features based on validation

---

**Ready to create branded apparel automatically?**

Start the servers and visit http://localhost:3000 to begin!
