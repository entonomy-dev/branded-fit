# Branded Fit MVP - API Integration Guide

**Date:** February 12, 2026
**Version:** 1.0
**Purpose:** Complete setup guide for external API integrations

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Brandfetch API Setup](#brandfetch-api-setup)
3. [Printify API Setup](#printify-api-setup)
4. [Shopify API Setup](#shopify-api-setup)
5. [Configuration](#configuration)
6. [Testing API Connections](#testing-api-connections)
7. [Rate Limits & Costs](#rate-limits--costs)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the APIs, ensure you have:

- ✅ Node.js 18+ installed
- ✅ A valid email address for API registrations
- ✅ Credit card for API services (some may require, but won't charge for free tiers)
- ✅ Shopify store (or trial account)

**Time to complete:** ~30-45 minutes

---

## Brandfetch API Setup

### Overview
Brandfetch provides company logo data and brand information. It's our primary logo retrieval service.

### Step 1: Create Account

1. Visit [https://brandfetch.com](https://brandfetch.com)
2. Click "Sign Up" (top right)
3. Register with email or Google account
4. Verify your email address

### Step 2: Get API Key

1. Log in to [https://dashboard.brandfetch.com](https://dashboard.brandfetch.com)
2. Navigate to **API** section in sidebar
3. Click **"Create API Key"**
4. Name it: "Branded Fit MVP"
5. Copy the API key (starts with `bf-...`)

**Security Note:** Keep this key secret! Don't commit to Git.

### Step 3: Verify API Access

Test your API key with curl:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.brandfetch.io/v2/brands/microsoft
```

**Expected Response:**
```json
{
  "name": "Microsoft",
  "domain": "microsoft.com",
  "logos": [
    {
      "type": "logo",
      "formats": [
        {
          "src": "https://...",
          "format": "png"
        }
      ]
    }
  ]
}
```

### Pricing & Limits

| Tier | Requests/Month | Cost |
|------|---------------|------|
| Free | 100 | $0 |
| Starter | 1,000 | $29/mo |
| Pro | 10,000 | $99/mo |

**For MVP:** Free tier is sufficient for testing (100 products).

---

## Printify API Setup

### Overview
Printify handles print-on-demand manufacturing and mockup generation.

### Step 1: Create Account

1. Visit [https://printify.com](https://printify.com)
2. Click **"Start for free"**
3. Register with email
4. Choose **"I'm a seller"** option
5. Complete onboarding (skip Shopify integration for now)

### Step 2: Create Shop

1. In Printify dashboard, click **"Add Store"**
2. Select **"Custom Integration"** (not Shopify yet)
3. Name your shop: "Branded Fit MVP"
4. Note the **Shop ID** (visible in URL or shop settings)

### Step 3: Generate API Token

1. Go to **Settings** → **API**
2. Click **"Generate Token"**
3. Name it: "MVP Backend"
4. Copy the API token (long alphanumeric string)

**Important:** Printify uses Bearer token authentication.

### Step 4: Configure Catalog

For MVP, we use **Bella+Canvas 3001** (standard unisex t-shirt):

- Blueprint ID: `3`
- Print Provider ID: `99` (generic)
- Available in: White, Black, 6 sizes

You can browse the catalog:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.printify.com/v1/catalog/blueprints.json
```

### Pricing Model

- **Platform Fee:** FREE to create products
- **Base Cost:** $8-12 per t-shirt (when ordered)
- **Shipping:** $4-8 (depends on location)
- **You Set Price:** Recommended $25+ (12-15% margin)

**For MVP:** No costs until actual orders are placed.

---

## Shopify API Setup

### Overview
Shopify is the e-commerce platform where products are listed and sold.

### Step 1: Create Shopify Store

1. Visit [https://shopify.com/free-trial](https://shopify.com/free-trial)
2. Enter email and click **"Start free trial"**
3. Complete store setup:
   - Store name: "Branded Fit Demo" (or your choice)
   - Choose: "I'm just playing around"
4. Note your store URL: `your-store.myshopify.com`

**Free trial:** 14 days, no credit card required initially.

### Step 2: Create Private App

Shopify requires a "Custom App" for API access:

1. In Shopify Admin, go to **Settings** → **Apps and sales channels**
2. Click **"Develop apps"**
3. Enable custom app development (if prompted)
4. Click **"Create an app"**
5. Name: "Branded Fit API"
6. Configure **Admin API scopes:**
   - ✅ `write_products` - Create/update products
   - ✅ `read_products` - Read product data
   - ✅ `write_inventory` - Manage inventory
7. Click **"Save"**
8. Click **"Install app"**

### Step 3: Get API Credentials

1. In the app settings, click **"API credentials"**
2. Copy:
   - **Admin API access token** (starts with `shpat_...`)
   - **API version:** Use `2024-01` (latest stable)

### Step 4: Test Connection

```bash
curl -X GET \
  -H "X-Shopify-Access-Token: YOUR_TOKEN" \
  https://your-store.myshopify.com/admin/api/2024-01/products.json
```

**Expected:** Empty products list (or existing products if any).

### Pricing

| Plan | Monthly Cost | Features |
|------|-------------|----------|
| Trial | $0 (14 days) | Full features |
| Basic | $39/mo | Unlimited products |
| Shopify | $105/mo | Better rates |

**For MVP:** Trial is sufficient for demo and validation.

---

## Configuration

### Step 1: Copy Environment Template

```bash
cd mvp/backend
cp .env.example .env
```

### Step 2: Fill in API Credentials

Edit `.env` file:

```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# Brandfetch API
BRANDFETCH_API_KEY=bf_your_actual_key_here

# Printify API
PRINTIFY_API_KEY=your_printify_token_here
PRINTIFY_SHOP_ID=123456

# Shopify API
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_actual_token_here
SHOPIFY_API_VERSION=2024-01

# Cache Configuration (optional, has defaults)
CACHE_TTL_SECONDS=3600
CACHE_CHECK_PERIOD_SECONDS=600

# Logging (optional)
LOG_LEVEL=info
```

### Step 3: Verify Configuration

Start the backend server:

```bash
npm install
npm start
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║           🎯 Branded Fit MVP Server Running              ║
║   Port: 8080                                             ║
║   Environment: development                               ║
╚═══════════════════════════════════════════════════════════╝
```

If you see configuration errors, double-check your API keys.

---

## Testing API Connections

### Test 1: Health Check

```bash
curl http://localhost:8080/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Test 2: Create Product

```bash
curl -X POST http://localhost:8080/api/products/create \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Microsoft"}'
```

**Expected (after 30-60s):**
```json
{
  "success": true,
  "data": {
    "companyName": "Microsoft",
    "shopifyProduct": {
      "id": "123456789",
      "title": "Microsoft Branded T-Shirt",
      "handle": "microsoft-branded-t-shirt",
      "url": "https://your-store.myshopify.com/products/microsoft-branded-t-shirt"
    },
    "duration": 45231
  }
}
```

### Test 3: Verify Shopify Product

1. Open your Shopify Admin
2. Go to **Products**
3. You should see: "Microsoft Branded T-Shirt"
4. Click to view details and mockup images

---

## Rate Limits & Costs

### API Rate Limits Summary

| API | Free Tier Limit | Overage Behavior |
|-----|----------------|------------------|
| Brandfetch | 100 req/month | 429 error, upgrade required |
| Printify | 300 req/min | 429 error, retry after cooldown |
| Shopify | 2 req/second | Throttled, automatic retry |

### Cost per Product Creation

| Step | API Calls | Cost (Free Tier) |
|------|-----------|------------------|
| Logo retrieval | 1 Brandfetch call | $0 (100/mo free) |
| Image upload | 1 Printify call | $0 |
| Product creation | 1 Printify call | $0 |
| Product publish | 1 Printify call | $0 |
| Shopify creation | 1 Shopify call | $0 |
| **Total** | **5 API calls** | **$0** |

**Cost only occurs when:**
- Customer places order → Printify charges $8-12 for manufacturing
- You profit from markup (sell at $25+)

### Caching to Reduce Costs

MVP includes logo caching (1 hour default):
- First request for "Microsoft" → API call
- Subsequent requests → Served from cache
- Saves API quota and improves speed

---

## Troubleshooting

### Issue 1: "Brandfetch API key invalid"

**Symptoms:**
```
Error: 401 Unauthorized from Brandfetch
```

**Solutions:**
1. Verify API key in `.env` is correct
2. Check if key has `bf-` prefix
3. Ensure no extra spaces in `.env` file
4. Regenerate key in Brandfetch dashboard

### Issue 2: "Logo not found"

**Symptoms:**
```
Error: Could not retrieve logo for "CompanyXYZ"
```

**Solutions:**
1. Try with domain instead: `companyxyz.com`
2. Try well-known company: `Microsoft`, `Apple`
3. Check Brandfetch manually: [brandfetch.com/search](https://brandfetch.com)
4. Company might not be in database (limitation of free tier)

### Issue 3: "Printify shop not found"

**Symptoms:**
```
Error: 404 Shop not found
```

**Solutions:**
1. Verify `PRINTIFY_SHOP_ID` is numeric (no letters)
2. Check shop ID in Printify dashboard URL
3. Ensure API token is from the correct shop
4. Try creating a new custom integration

### Issue 4: "Shopify authentication failed"

**Symptoms:**
```
Error: 401 Unauthorized from Shopify
```

**Solutions:**
1. Verify access token starts with `shpat_`
2. Check store URL format: `store.myshopify.com` (no https://)
3. Ensure app has `write_products` permission
4. Reinstall the custom app if needed

### Issue 5: "Timeout creating product"

**Symptoms:**
```
Error: Request timeout after 30000ms
```

**Solutions:**
1. Check internet connection stability
2. Verify all APIs are responding (test individually)
3. Increase timeout in code if consistently slow
4. Check API status pages:
   - Brandfetch: [status.brandfetch.io](https://status.brandfetch.io)
   - Printify: [status.printify.com](https://status.printify.com)
   - Shopify: [status.shopify.com](https://status.shopify.com)

### Issue 6: "Rate limit exceeded"

**Symptoms:**
```
Error: 429 Too Many Requests
```

**Solutions:**
1. Wait 60 seconds and retry
2. Implement exponential backoff
3. Use caching to reduce API calls
4. Upgrade API tier if testing heavily

---

## API Documentation References

### Official Documentation

- **Brandfetch API:** [docs.brandfetch.com](https://docs.brandfetch.com)
- **Printify API:** [developers.printify.com](https://developers.printify.com)
- **Shopify API:** [shopify.dev/docs/api/admin-rest](https://shopify.dev/docs/api/admin-rest)

### Support Channels

- **Brandfetch:** support@brandfetch.com
- **Printify:** Help Center in dashboard
- **Shopify:** help.shopify.com (24/7 chat)

---

## Security Best Practices

### DO:
✅ Store API keys in `.env` file
✅ Add `.env` to `.gitignore`
✅ Use environment variables in production
✅ Rotate keys periodically
✅ Use separate keys for dev/prod

### DON'T:
❌ Commit API keys to Git
❌ Share keys in chat/email
❌ Use production keys in development
❌ Hard-code keys in source files
❌ Store keys in frontend code

---

## Next Steps

After successful API setup:

1. ✅ Run integration tests with test companies
2. ✅ Deploy to staging environment
3. ✅ Set up monitoring for API errors
4. ✅ Configure production API keys
5. ✅ Enable HTTPS for production
6. ✅ Set up error alerting (email/Slack)

---

## Conclusion

All three API integrations are now configured and tested. The MVP is ready to create branded products automatically. If you encounter issues not covered here, check the logs in `backend/logs/` for detailed error information.

**Support:** For MVP-specific issues, contact the development team.
