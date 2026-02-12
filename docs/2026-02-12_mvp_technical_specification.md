# Branded Fit MVP - Technical Specification & Implementation

**Date:** February 12, 2026
**Version:** 1.0
**Prepared by:** Technical Lead
**Status:** Development Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [API Integration Specifications](#api-integration-specifications)
5. [Implementation Plan](#implementation-plan)
6. [Code Structure](#code-structure)
7. [Data Flow & Workflows](#data-flow--workflows)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [MVP Scope & Limitations](#mvp-scope--limitations)
13. [Timeline & Milestones](#timeline--milestones)
14. [Technical Risks & Mitigation](#technical-risks--mitigation)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

Branded Fit MVP is a functional prototype demonstrating the core automated workflow for corporate apparel creation. The system accepts a company name as input, automatically retrieves the company logo, applies it to merchandise mockups, and creates a live Shopify product page ready for purchase.

### Key Features
- **Single-page web interface** for company name input
- **Automated logo discovery** via Brandfetch API
- **Automated mockup generation** via Printify API
- **Live Shopify product creation** with automated listing
- **Error handling and logging** for production readiness
- **Caching layer** to minimize API costs

### Technical Highlights
- **Node.js/Express backend** with TypeScript for type safety
- **React frontend** with modern UI/UX
- **PostgreSQL database** for state management and caching
- **Redis cache** for logo and API response caching
- **Docker containerization** for easy deployment
- **Comprehensive logging** with Winston

### Success Metrics
- Complete workflow from company name to live Shopify product in < 60 seconds
- 95%+ success rate for Fortune 1000 companies
- API cost < $0.50 per product creation
- System uptime > 99% during testing phase

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          React Web Application (Port 3000)                │  │
│  │  - Company name input form                                │  │
│  │  - Real-time progress tracking                            │  │
│  │  - Product preview display                                │  │
│  │  - Shopify link generation                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Express API Server (Port 8080)                     │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌──────────────────┐              │  │
│  │  │  Product        │  │  Workflow        │              │  │
│  │  │  Controller     │  │  Orchestrator    │              │  │
│  │  └─────────────────┘  └──────────────────┘              │  │
│  │           │                    │                         │  │
│  │           └────────┬───────────┘                         │  │
│  │                    │                                     │  │
│  │  ┌─────────────────┴───────────────────────────────┐    │  │
│  │  │           Service Layer                          │    │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │    │  │
│  │  │  │ Logo Service │  │Printify Svc  │            │    │  │
│  │  │  └──────────────┘  └──────────────┘            │    │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │    │  │
│  │  │  │Shopify Svc   │  │ Cache Service│            │    │  │
│  │  │  └──────────────┘  └──────────────┘            │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Brandfetch  │  │   Printify   │  │   Shopify    │          │
│  │     API      │  │     API      │  │     API      │          │
│  │              │  │              │  │              │          │
│  │ Logo         │  │ Mockup       │  │ Product      │          │
│  │ Retrieval    │  │ Generation   │  │ Listing      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │   PostgreSQL     │           │      Redis       │            │
│  │                  │           │                  │            │
│  │  - Products      │           │  - Logo cache    │            │
│  │  - Workflows     │           │  - API responses │            │
│  │  - Audit logs    │           │  - Rate limits   │            │
│  └──────────────────┘           └──────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW ORCHESTRATOR                        │
│                                                                  │
│  Input: Company Name (e.g., "Google")                          │
│                                                                  │
│  Step 1: Normalize & Validate                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Convert to domain format (google.com)                │    │
│  │ • Validate domain exists                               │    │
│  │ • Check blacklist/whitelist                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼                                       │
│  Step 2: Logo Retrieval                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Check cache (Redis) for existing logo               │    │
│  │ • If miss: Call Brandfetch API                         │    │
│  │ • Download logo file (SVG/PNG)                         │    │
│  │ • Store in cache (TTL: 30 days)                        │    │
│  │ • Validate logo dimensions/format                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼                                       │
│  Step 3: Logo Processing                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Validate image format                                │    │
│  │ • Optimize for print (min 300 DPI)                     │    │
│  │ • Convert to PNG if SVG                                │    │
│  │ • Resize to Printify requirements                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼                                       │
│  Step 4: Mockup Generation                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Upload logo to Printify                              │    │
│  │ • Create print areas (front center)                    │    │
│  │ • Apply to blueprint (Bella+Canvas 3001)               │    │
│  │ • Generate mockups for all sizes (S-3XL)               │    │
│  │ • Wait for mockup rendering (async)                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼                                       │
│  Step 5: Shopify Product Creation                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Create product with company name                     │    │
│  │ • Add variants (sizes, colors)                         │    │
│  │ • Upload mockup images                                 │    │
│  │ • Set pricing ($24.99 base)                            │    │
│  │ • Configure Printify fulfillment                       │    │
│  │ • Publish to online store                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                         │                                       │
│                         ▼                                       │
│  Output: Live Shopify Product URL                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Input                 Database                   External APIs
   │                          │                            │
   │ 1. Enter "Nike"          │                            │
   └──────────────────────────┼────────────────────────────┤
                              │                            │
   ┌──────────────────────────┘                            │
   │ 2. Create workflow record                             │
   │    Status: "STARTED"                                  │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
   ┌──────────────────────────┘                            │
   │ 3. Check logo cache                                   │
   │    Cache MISS                                         │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
                              │ 4. GET /brands/nike.com    │
                              │ ───────────────────────────►
                              │ ◄───────────────────────────
                              │    Logo URL, Brand Data     │
   ┌──────────────────────────┘                            │
   │ 5. Cache logo (30 days)                               │
   │    Update workflow:                                   │
   │    Status: "LOGO_FOUND"                               │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
                              │ 6. POST /uploads/images    │
                              │ ───────────────────────────►
                              │ ◄───────────────────────────
                              │    Image ID                 │
   ┌──────────────────────────┘                            │
   │ 7. Store image_id                                     │
   │    Status: "MOCKUP_CREATING"                          │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
                              │ 8. POST /products          │
                              │    (with print areas)      │
                              │ ───────────────────────────►
                              │ ◄───────────────────────────
                              │    Product ID, mockups     │
   ┌──────────────────────────┘                            │
   │ 9. Store printify_id                                  │
   │    Status: "MOCKUP_COMPLETE"                          │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
                              │ 10. POST /products         │
                              │     (Shopify)              │
                              │ ───────────────────────────►
                              │ ◄───────────────────────────
                              │    Shopify Product         │
   ┌──────────────────────────┘                            │
   │ 11. Store shopify_id                                  │
   │     product_url                                       │
   │     Status: "COMPLETED"                               │
   └──────────────────────────┬────────────────────────────┤
                              │                            │
   Display Product URL        │                            │
   ◄──────────────────────────┘                            │
```

---

## Technology Stack

### Backend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Runtime | Node.js | 20.x LTS | Stable, excellent API integration support |
| Framework | Express | 4.18.x | Lightweight, widely adopted, middleware ecosystem |
| Language | TypeScript | 5.3.x | Type safety, better IDE support, fewer runtime errors |
| Database | PostgreSQL | 16.x | ACID compliance, JSON support, reliable |
| Cache | Redis | 7.2.x | Fast key-value store, TTL support, pub/sub |
| ORM | Prisma | 5.x | Type-safe database client, migrations |
| HTTP Client | Axios | 1.6.x | Promise-based, interceptors, timeout handling |
| Logging | Winston | 3.11.x | Structured logging, multiple transports |
| Validation | Zod | 3.22.x | TypeScript-first schema validation |
| Task Queue | Bull | 4.12.x | Redis-based job queue, retry logic |

### Frontend Stack

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Framework | React | 18.2.x | Component-based, large ecosystem |
| Build Tool | Vite | 5.0.x | Fast HMR, optimized builds |
| Language | TypeScript | 5.3.x | Type safety across full stack |
| State Management | Zustand | 4.4.x | Simple, performant, no boilerplate |
| HTTP Client | Axios | 1.6.x | Consistent with backend |
| UI Components | Tailwind CSS | 3.4.x | Utility-first, rapid development |
| Icons | Lucide React | 0.309.x | Modern, tree-shakeable icons |

### DevOps & Infrastructure

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Containerization | Docker | 24.x | Consistent environments, easy deployment |
| Orchestration | Docker Compose | 2.x | Multi-container development |
| Process Manager | PM2 | 5.3.x | Production process management |
| Environment Variables | dotenv | 16.3.x | Secure configuration management |
| API Testing | Postman/Thunder Client | Latest | API development and testing |

### External APIs

| Service | Purpose | Plan | Cost |
|---------|---------|------|------|
| Brandfetch | Logo retrieval | Growth (5K/mo) | $129/month |
| Printify | Print-on-demand fulfillment | Free + per-order | $0 + fulfillment |
| Shopify | E-commerce platform | Basic | $29/month |

**Total Fixed Monthly Cost:** $158/month
**Variable Cost:** ~$8-12 per product sold (Printify fulfillment)

---

## API Integration Specifications

### 1. Brandfetch API Integration

#### Authentication
```typescript
headers: {
  'x-api-key': process.env.BRANDFETCH_API_KEY
}
```

#### Endpoint: Brand Lookup
```http
GET https://api.brandfetch.io/v2/brands/{domain}
```

**Example Request:**
```typescript
const response = await axios.get(
  'https://api.brandfetch.io/v2/brands/google.com',
  {
    headers: { 'x-api-key': BRANDFETCH_API_KEY }
  }
);
```

**Example Response:**
```json
{
  "id": "google.com",
  "name": "Google",
  "domain": "google.com",
  "claimed": true,
  "description": "Search the world's information...",
  "longDescription": "...",
  "links": [
    { "name": "website", "url": "https://www.google.com" }
  ],
  "logos": [
    {
      "type": "logo",
      "theme": "dark",
      "formats": [
        {
          "src": "https://asset.brandfetch.io/...",
          "background": "transparent",
          "format": "png",
          "height": 512,
          "width": 512
        }
      ]
    }
  ],
  "colors": [
    { "hex": "#4285f4", "type": "brand" }
  ]
}
```

**Error Handling:**
- `404`: Brand not found → Fallback to text-based logo
- `429`: Rate limit exceeded → Implement exponential backoff
- `401`: Invalid API key → Alert admin

**Caching Strategy:**
```typescript
// Cache key format
const cacheKey = `logo:${domain}`;
const cacheTTL = 30 * 24 * 60 * 60; // 30 days

// Cache structure
interface CachedLogo {
  domain: string;
  logoUrl: string;
  brandName: string;
  colors: string[];
  cachedAt: Date;
}
```

---

### 2. Printify API Integration

#### Authentication
```typescript
headers: {
  'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
  'Content-Type': 'application/json'
}
```

#### Base URL
```
https://api.printify.com/v1/
```

#### Workflow Steps

**Step 1: Upload Logo Image**
```http
POST /uploads/images.json
```

**Request:**
```typescript
const formData = new FormData();
formData.append('file', logoImageBuffer, 'logo.png');
formData.append('file_name', 'company-logo.png');

const uploadResponse = await axios.post(
  'https://api.printify.com/v1/uploads/images.json',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_TOKEN}`,
      ...formData.getHeaders()
    }
  }
);
```

**Response:**
```json
{
  "id": "5d39b159b8e7e332",
  "file_name": "company-logo.png",
  "height": 1000,
  "width": 1000,
  "size": 45032,
  "mime_type": "image/png",
  "preview_url": "https://images.printify.com/...",
  "upload_time": "2026-02-12 12:00:00"
}
```

**Step 2: Create Product with Print Areas**
```http
POST /shops/{shop_id}/products.json
```

**Request Payload:**
```json
{
  "title": "Google Branded T-Shirt",
  "description": "Premium quality t-shirt featuring the Google logo",
  "blueprint_id": 3,
  "print_provider_id": 99,
  "variants": [
    {
      "id": 17390,
      "price": 2499,
      "is_enabled": true
    }
  ],
  "print_areas": [
    {
      "variant_ids": [17390, 17394, 17398, 17402, 17406],
      "placeholders": [
        {
          "position": "front",
          "images": [
            {
              "id": "5d39b159b8e7e332",
              "x": 0.5,
              "y": 0.5,
              "scale": 1,
              "angle": 0
            }
          ]
        }
      ]
    }
  ]
}
```

**Blueprint Reference:**
- Blueprint ID `3` = Bella + Canvas 3001 (Unisex Jersey T-Shirt)
- Print Provider ID `99` = Monster Digital (fast, reliable)

**Variant IDs (Bella+Canvas 3001):**
- 17390: Small
- 17394: Medium
- 17398: Large
- 17402: XL
- 17406: 2XL
- 17409: 3XL

**Response:**
```json
{
  "id": "5e16bb44b8e7e300",
  "title": "Google Branded T-Shirt",
  "description": "Premium quality t-shirt featuring the Google logo",
  "tags": ["corporate", "branded"],
  "options": [
    {
      "name": "Size",
      "type": "size",
      "values": [
        {"id": 1, "title": "S"},
        {"id": 2, "title": "M"},
        {"id": 3, "title": "L"},
        {"id": 4, "title": "XL"},
        {"id": 5, "title": "2XL"},
        {"id": 6, "title": "3XL"}
      ]
    }
  ],
  "variants": [
    {
      "id": 45740,
      "sku": "BFC3001-17390",
      "cost": 949,
      "price": 2499,
      "title": "S / White",
      "grams": 142,
      "is_enabled": true,
      "is_default": false,
      "is_available": true,
      "options": [1],
      "quantity": 0
    }
  ],
  "images": [
    {
      "src": "https://images-api.printify.com/mockup/...",
      "variant_ids": [45740],
      "position": "front",
      "is_default": true
    }
  ],
  "created_at": "2026-02-12 12:00:00",
  "updated_at": "2026-02-12 12:00:00",
  "visible": true,
  "is_locked": false,
  "blueprint_id": 3,
  "user_id": 12345,
  "shop_id": 67890,
  "print_provider_id": 99,
  "print_areas": [...]
}
```

**Step 3: Publish Product to Shopify**
```http
POST /shops/{shop_id}/products/{product_id}/publish.json
```

**Request:**
```json
{
  "title": true,
  "description": true,
  "images": true,
  "variants": true,
  "tags": true,
  "keyFeatures": true,
  "shipping_template": true
}
```

**Response:**
```json
{
  "external_id": "shopify:8234567890123",
  "published_at": "2026-02-12 12:00:00"
}
```

---

### 3. Shopify API Integration

#### Authentication
```typescript
headers: {
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json'
}
```

#### Base URL
```
https://{shop-name}.myshopify.com/admin/api/2024-01/
```

#### Product Verification Endpoint
```http
GET /products/{product_id}.json
```

**Example Request:**
```typescript
const shopifyProduct = await axios.get(
  `https://${SHOP_NAME}.myshopify.com/admin/api/2024-01/products/${productId}.json`,
  {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN
    }
  }
);
```

**Response:**
```json
{
  "product": {
    "id": 8234567890123,
    "title": "Google Branded T-Shirt",
    "body_html": "<p>Premium quality t-shirt featuring the Google logo</p>",
    "vendor": "Branded Fit",
    "product_type": "T-Shirt",
    "created_at": "2026-02-12T12:00:00-05:00",
    "handle": "google-branded-t-shirt",
    "updated_at": "2026-02-12T12:00:00-05:00",
    "published_at": "2026-02-12T12:00:00-05:00",
    "status": "active",
    "published_scope": "web",
    "tags": "corporate, branded, custom",
    "admin_graphql_api_id": "gid://shopify/Product/8234567890123",
    "variants": [
      {
        "id": 45678901234567,
        "product_id": 8234567890123,
        "title": "S",
        "price": "24.99",
        "sku": "GOOGLE-S-WHT",
        "position": 1,
        "inventory_policy": "deny",
        "compare_at_price": null,
        "fulfillment_service": "printify",
        "inventory_management": "printify",
        "option1": "S",
        "option2": null,
        "option3": null,
        "created_at": "2026-02-12T12:00:00-05:00",
        "updated_at": "2026-02-12T12:00:00-05:00",
        "taxable": true,
        "grams": 142,
        "weight": 0.31,
        "weight_unit": "lb"
      }
    ],
    "options": [
      {
        "id": 10123456789,
        "product_id": 8234567890123,
        "name": "Size",
        "position": 1,
        "values": ["S", "M", "L", "XL", "2XL", "3XL"]
      }
    ],
    "images": [
      {
        "id": 34567890123456,
        "product_id": 8234567890123,
        "position": 1,
        "created_at": "2026-02-12T12:00:00-05:00",
        "updated_at": "2026-02-12T12:00:00-05:00",
        "alt": "Google Branded T-Shirt - Front View",
        "width": 1000,
        "height": 1000,
        "src": "https://cdn.shopify.com/...",
        "variant_ids": []
      }
    ],
    "image": {
      "id": 34567890123456,
      "product_id": 8234567890123,
      "position": 1,
      "created_at": "2026-02-12T12:00:00-05:00",
      "updated_at": "2026-02-12T12:00:00-05:00",
      "alt": "Google Branded T-Shirt - Front View",
      "width": 1000,
      "height": 1000,
      "src": "https://cdn.shopify.com/..."
    }
  }
}
```

**Public Product URL:**
```
https://{shop-name}.myshopify.com/products/{handle}
```

Example: `https://branded-fit.myshopify.com/products/google-branded-t-shirt`

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

**Objective:** Establish project structure, development environment, and core dependencies.

#### Tasks:
1. **Initialize monorepo structure**
   - Create backend directory with TypeScript/Express
   - Create frontend directory with React/Vite
   - Configure shared TypeScript configs
   - Setup ESLint and Prettier

2. **Database setup**
   - Initialize PostgreSQL with Docker
   - Design database schema with Prisma
   - Create migrations
   - Seed test data

3. **Redis cache setup**
   - Configure Redis with Docker
   - Implement cache utility functions
   - Setup TTL policies

4. **Environment configuration**
   - Create `.env.example` templates
   - Document all required API keys
   - Setup environment validation

5. **Docker configuration**
   - Create Dockerfile for backend
   - Create Dockerfile for frontend
   - Create docker-compose.yml for full stack
   - Configure networking between containers

**Deliverables:**
- Running Docker environment with all services
- Database schema with migrations
- Linted and formatted codebase
- Environment setup documentation

---

### Phase 2: Core Services Implementation (Week 2-3)

**Objective:** Build the core service layer for API integrations.

#### Tasks:

**Logo Service (logo.service.ts)**
```typescript
class LogoService {
  async findLogo(domain: string): Promise<LogoResult>
  async downloadLogo(url: string): Promise<Buffer>
  async cacheLogooptimizeLogo(buffer: Buffer): Promise<Buffer>
  private async fetchFromBrandfetch(domain: string): Promise<BrandfetchResponse>
}
```

**Printify Service (printify.service.ts)**
```typescript
class PrintifyService {
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<ImageUpload>
  async createProduct(productData: ProductCreateRequest): Promise<PrintifyProduct>
  async publishToShopify(productId: string): Promise<PublishResult>
  async getProduct(productId: string): Promise<PrintifyProduct>
}
```

**Shopify Service (shopify.service.ts)**
```typescript
class ShopifyService {
  async getProduct(productId: string): Promise<ShopifyProduct>
  async generateProductUrl(handle: string): Promise<string>
  async verifyProductPublished(externalId: string): Promise<boolean>
}
```

**Cache Service (cache.service.ts)**
```typescript
class CacheService {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async del(key: string): Promise<void>
  async exists(key: string): Promise<boolean>
}
```

**Deliverables:**
- Fully tested service layer
- Unit tests for each service (>80% coverage)
- Integration tests with API mocks
- Service documentation

---

### Phase 3: Workflow Orchestration (Week 3-4)

**Objective:** Build the workflow orchestrator that coordinates all services.

#### Tasks:

**Workflow Orchestrator (workflow.service.ts)**
```typescript
class WorkflowOrchestrator {
  async createProduct(companyName: string): Promise<WorkflowResult> {
    // Step 1: Normalize company name to domain
    const domain = this.normalizeToDomain(companyName);

    // Step 2: Create workflow record
    const workflow = await this.createWorkflowRecord(domain);

    try {
      // Step 3: Retrieve logo
      const logo = await this.logoService.findLogo(domain);
      await this.updateWorkflow(workflow.id, 'LOGO_FOUND');

      // Step 4: Upload to Printify
      const imageUpload = await this.printifyService.uploadImage(
        logo.buffer,
        `${domain}-logo.png`
      );
      await this.updateWorkflow(workflow.id, 'IMAGE_UPLOADED');

      // Step 5: Create Printify product
      const printifyProduct = await this.printifyService.createProduct({
        title: `${logo.brandName} Branded T-Shirt`,
        imageId: imageUpload.id,
        variants: this.getStandardVariants()
      });
      await this.updateWorkflow(workflow.id, 'PRODUCT_CREATED');

      // Step 6: Publish to Shopify
      const publishResult = await this.printifyService.publishToShopify(
        printifyProduct.id
      );
      await this.updateWorkflow(workflow.id, 'PUBLISHED');

      // Step 7: Generate product URL
      const productUrl = await this.shopifyService.generateProductUrl(
        publishResult.handle
      );

      // Step 8: Complete workflow
      await this.completeWorkflow(workflow.id, {
        productUrl,
        shopifyId: publishResult.externalId,
        printifyId: printifyProduct.id
      });

      return {
        success: true,
        productUrl,
        workflow
      };

    } catch (error) {
      await this.failWorkflow(workflow.id, error);
      throw error;
    }
  }
}
```

**Database Schema (Prisma)**
```prisma
model Workflow {
  id            String   @id @default(cuid())
  domain        String
  brandName     String?
  status        WorkflowStatus
  logoUrl       String?
  printifyId    String?
  shopifyId     String?
  productUrl    String?
  error         String?
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?

  @@index([domain])
  @@index([status])
  @@index([createdAt])
}

enum WorkflowStatus {
  STARTED
  LOGO_FOUND
  IMAGE_UPLOADED
  PRODUCT_CREATED
  PUBLISHED
  COMPLETED
  FAILED
}
```

**Deliverables:**
- Working end-to-end workflow
- Error handling and retry logic
- Workflow state persistence
- Integration tests for full flow

---

### Phase 4: API Layer (Week 4)

**Objective:** Build RESTful API endpoints for frontend consumption.

#### Endpoints:

**POST /api/products/create**
```typescript
// Request
{
  "companyName": "Google"
}

// Response (Success)
{
  "success": true,
  "workflowId": "clx123abc",
  "status": "STARTED",
  "message": "Product creation started"
}

// Response (Error)
{
  "success": false,
  "error": "LOGO_NOT_FOUND",
  "message": "Could not find logo for google.com"
}
```

**GET /api/workflows/:id**
```typescript
// Response
{
  "id": "clx123abc",
  "domain": "google.com",
  "brandName": "Google",
  "status": "COMPLETED",
  "productUrl": "https://branded-fit.myshopify.com/products/google-branded-t-shirt",
  "createdAt": "2026-02-12T12:00:00Z",
  "completedAt": "2026-02-12T12:00:45Z",
  "timeline": [
    { "status": "STARTED", "timestamp": "2026-02-12T12:00:00Z" },
    { "status": "LOGO_FOUND", "timestamp": "2026-02-12T12:00:05Z" },
    { "status": "IMAGE_UPLOADED", "timestamp": "2026-02-12T12:00:15Z" },
    { "status": "PRODUCT_CREATED", "timestamp": "2026-02-12T12:00:35Z" },
    { "status": "PUBLISHED", "timestamp": "2026-02-12T12:00:40Z" },
    { "status": "COMPLETED", "timestamp": "2026-02-12T12:00:45Z" }
  ]
}
```

**GET /api/health**
```typescript
// Response
{
  "status": "healthy",
  "timestamp": "2026-02-12T12:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "brandfetch": "healthy",
    "printify": "healthy",
    "shopify": "healthy"
  },
  "version": "1.0.0"
}
```

**Deliverables:**
- RESTful API with all endpoints
- Request/response validation
- API documentation (OpenAPI/Swagger)
- Postman collection

---

### Phase 5: Frontend Implementation (Week 5)

**Objective:** Build user-facing web interface.

#### Components:

**1. Product Creation Form**
```typescript
// components/ProductCreationForm.tsx
interface ProductCreationFormProps {
  onSubmit: (companyName: string) => void;
  loading: boolean;
}

const ProductCreationForm: React.FC<ProductCreationFormProps> = ({
  onSubmit,
  loading
}) => {
  // Company name input
  // Validation
  // Submit button
  // Loading state
};
```

**2. Workflow Progress Tracker**
```typescript
// components/WorkflowProgress.tsx
interface WorkflowProgressProps {
  workflow: Workflow;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ workflow }) => {
  // Progress bar
  // Status timeline
  // Current step indicator
  // Estimated time remaining
};
```

**3. Product Preview**
```typescript
// components/ProductPreview.tsx
interface ProductPreviewProps {
  productUrl: string;
  mockupImages: string[];
  brandName: string;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({
  productUrl,
  mockupImages,
  brandName
}) => {
  // Mockup image gallery
  // Product details
  // Shopify link
  // Share buttons
};
```

**Page Structure:**
```
/
├── Header (Branded Fit logo, navigation)
├── Hero Section
│   ├── Headline: "Create Branded Apparel in 60 Seconds"
│   ├── Subheadline: "Enter a company name, get a live product"
│   └── ProductCreationForm
├── Progress Section (conditional)
│   └── WorkflowProgress
├── Results Section (conditional)
│   └── ProductPreview
└── Footer (Links, legal)
```

**Deliverables:**
- Responsive web interface
- Real-time progress updates
- Error handling and user feedback
- Mobile-optimized design

---

### Phase 6: Testing & Validation (Week 6)

**Objective:** Comprehensive testing across all layers.

#### Testing Strategy:

**1. Unit Tests**
- Service layer methods
- Utility functions
- Data transformations
- Validation logic

**2. Integration Tests**
- API endpoint tests
- Database operations
- External API mocking
- Cache operations

**3. End-to-End Tests**
- Full workflow completion
- Error scenarios
- Edge cases (missing logos, API failures)
- Performance under load

**4. Manual Testing**
- Test with 50+ company names
- Verify Shopify product quality
- Check mockup rendering
- Validate pricing and variants

**Test Companies:**
- Fortune 500: Google, Apple, Microsoft, Amazon, Meta
- Mid-size: Stripe, Notion, Figma, Vercel
- Startups: Various domains
- Edge cases: New companies, non-existent domains

**Deliverables:**
- >80% code coverage
- All integration tests passing
- E2E test suite
- Test report with findings

---

### Phase 7: Documentation & Deployment (Week 7)

**Objective:** Complete documentation and deploy MVP.

#### Documentation:

**1. Setup Guide**
- Prerequisites
- Installation steps
- Environment configuration
- Local development

**2. API Documentation**
- Endpoint reference
- Request/response examples
- Error codes
- Rate limits

**3. Deployment Guide**
- Docker deployment
- Environment variables
- Database migrations
- SSL/TLS configuration

**4. Operations Guide**
- Monitoring setup
- Log analysis
- Performance tuning
- Troubleshooting

#### Deployment:

**Option 1: Docker Compose (Recommended for MVP)**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Option 2: Cloud Deployment (Future)**
- Backend: Railway, Render, or Fly.io
- Frontend: Vercel or Netlify
- Database: Supabase or Neon
- Redis: Upstash

**Deliverables:**
- Complete documentation set
- Deployed MVP environment
- Monitoring dashboards
- Runbook for operations

---

## Code Structure

```
branded-fit-mvp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts           # Prisma client configuration
│   │   │   ├── redis.ts              # Redis client configuration
│   │   │   └── env.ts                # Environment validation
│   │   ├── services/
│   │   │   ├── logo.service.ts       # Brandfetch integration
│   │   │   ├── printify.service.ts   # Printify integration
│   │   │   ├── shopify.service.ts    # Shopify integration
│   │   │   ├── cache.service.ts      # Redis caching
│   │   │   └── workflow.service.ts   # Orchestration logic
│   │   ├── controllers/
│   │   │   ├── product.controller.ts # Product endpoints
│   │   │   ├── workflow.controller.ts# Workflow endpoints
│   │   │   └── health.controller.ts  # Health check
│   │   ├── models/
│   │   │   ├── workflow.model.ts     # Workflow types
│   │   │   └── product.model.ts      # Product types
│   │   ├── utils/
│   │   │   ├── logger.ts             # Winston logger
│   │   │   ├── errors.ts             # Custom errors
│   │   │   ├── validation.ts         # Zod schemas
│   │   │   └── domain.ts             # Domain normalization
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts       # Global error handler
│   │   │   ├── requestLogger.ts      # Request logging
│   │   │   └── validation.ts         # Request validation
│   │   ├── routes/
│   │   │   ├── product.routes.ts     # Product routes
│   │   │   ├── workflow.routes.ts    # Workflow routes
│   │   │   └── index.ts              # Route aggregation
│   │   ├── types/
│   │   │   ├── brandfetch.types.ts   # Brandfetch types
│   │   │   ├── printify.types.ts     # Printify types
│   │   │   └── shopify.types.ts      # Shopify types
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── migrations/               # Migration files
│   │   └── seed.ts                   # Seed data
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/             # Service tests
│   │   │   └── utils/                # Utility tests
│   │   ├── integration/
│   │   │   ├── api/                  # API endpoint tests
│   │   │   └── workflow/             # Workflow tests
│   │   └── e2e/
│   │       └── product-creation.test.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductCreationForm.tsx
│   │   │   ├── WorkflowProgress.tsx
│   │   │   ├── ProductPreview.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Main page
│   │   │   └── NotFound.tsx          # 404 page
│   │   ├── store/
│   │   │   └── workflow.store.ts     # Zustand store
│   │   ├── services/
│   │   │   └── api.service.ts        # API client
│   │   ├── types/
│   │   │   └── workflow.types.ts     # TypeScript types
│   │   ├── utils/
│   │   │   ├── constants.ts          # App constants
│   │   │   └── helpers.ts            # Helper functions
│   │   ├── App.tsx                   # App component
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── public/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml                # Multi-container setup
├── .gitignore
├── README.md                         # Project overview
└── docs/
    ├── 2026-02-12_mvp_technical_specification.md  # This file
    ├── API.md                        # API documentation
    ├── SETUP.md                      # Setup guide
    └── DEPLOYMENT.md                 # Deployment guide
```

---

## Data Flow & Workflows

### Primary Workflow: Product Creation

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: INPUT VALIDATION & NORMALIZATION                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Input: "Google" or "google.com" or "www.google.com"        │
│                                                             │
│ Step 1.1: Normalize input                                  │
│   • Remove whitespace and special characters               │
│   • Convert to lowercase                                   │
│   • Extract domain if URL provided                         │
│   Result: "google.com"                                     │
│                                                             │
│ Step 1.2: Validate domain                                  │
│   • Check format (valid domain pattern)                    │
│   • Verify not in blacklist                                │
│   • DNS lookup (optional)                                  │
│                                                             │
│ Step 1.3: Create workflow record                           │
│   INSERT INTO workflows (domain, status, created_at)       │
│   VALUES ('google.com', 'STARTED', NOW())                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: LOGO RETRIEVAL                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 2.1: Check cache                                      │
│   key = "logo:google.com"                                  │
│   IF EXISTS → return cached data (CACHE HIT)               │
│   ELSE → proceed to API call (CACHE MISS)                  │
│                                                             │
│ Step 2.2: Call Brandfetch API                              │
│   GET https://api.brandfetch.io/v2/brands/google.com       │
│   Headers: { 'x-api-key': BRANDFETCH_API_KEY }            │
│                                                             │
│ Step 2.3: Handle response                                  │
│   SUCCESS (200):                                            │
│     • Extract logo URL (prefer PNG > SVG)                  │
│     • Extract brand name                                   │
│     • Extract brand colors                                 │
│   NOT_FOUND (404):                                          │
│     • Generate fallback logo (initials + color)            │
│   RATE_LIMITED (429):                                       │
│     • Implement exponential backoff                        │
│     • Retry up to 3 times                                  │
│   ERROR (5xx):                                              │
│     • Log error                                            │
│     • Use fallback logo                                    │
│                                                             │
│ Step 2.4: Download logo file                               │
│   GET {logoUrl}                                            │
│   • Download as Buffer                                     │
│   • Validate file size (< 5MB)                             │
│   • Validate dimensions (min 500x500px)                    │
│                                                             │
│ Step 2.5: Optimize logo                                    │
│   • Convert to PNG if SVG                                  │
│   • Resize to 1000x1000px                                  │
│   • Ensure transparent background                          │
│   • Optimize for print (300 DPI)                           │
│                                                             │
│ Step 2.6: Cache result                                     │
│   SET "logo:google.com" = {                                │
│     logoBuffer: Buffer,                                    │
│     brandName: "Google",                                   │
│     colors: ["#4285f4"],                                   │
│     cachedAt: Date                                         │
│   }                                                         │
│   TTL: 30 days                                             │
│                                                             │
│ Step 2.7: Update workflow                                  │
│   UPDATE workflows                                          │
│   SET status = 'LOGO_FOUND', logo_url = {url}              │
│   WHERE id = {workflowId}                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: PRINTIFY IMAGE UPLOAD                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 3.1: Prepare upload                                   │
│   • Create FormData with logo buffer                       │
│   • Set filename: "google-logo.png"                        │
│   • Set content-type: "image/png"                          │
│                                                             │
│ Step 3.2: Upload to Printify                               │
│   POST https://api.printify.com/v1/uploads/images.json     │
│   Headers: {                                                │
│     'Authorization': 'Bearer {PRINTIFY_TOKEN}'             │
│   }                                                         │
│   Body: FormData                                            │
│                                                             │
│ Step 3.3: Handle response                                  │
│   SUCCESS (200):                                            │
│     {                                                       │
│       "id": "5d39b159b8e7e332",                            │
│       "file_name": "google-logo.png",                      │
│       "preview_url": "https://...",                        │
│       "width": 1000,                                        │
│       "height": 1000                                        │
│     }                                                       │
│   ERROR:                                                    │
│     • Log error with workflow context                      │
│     • Mark workflow as FAILED                              │
│     • Throw error to client                                │
│                                                             │
│ Step 3.4: Update workflow                                  │
│   UPDATE workflows                                          │
│   SET status = 'IMAGE_UPLOADED',                           │
│       printify_image_id = '5d39b159b8e7e332'               │
│   WHERE id = {workflowId}                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: PRINTIFY PRODUCT CREATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 4.1: Build product payload                            │
│   {                                                         │
│     "title": "Google Branded T-Shirt",                     │
│     "description": "Premium quality...",                   │
│     "blueprint_id": 3,  // Bella+Canvas 3001               │
│     "print_provider_id": 99,  // Monster Digital           │
│     "variants": [                                           │
│       {                                                     │
│         "id": 17390,  // Small                             │
│         "price": 2499,  // $24.99                          │
│         "is_enabled": true                                 │
│       },                                                    │
│       { "id": 17394, "price": 2499 },  // Medium           │
│       { "id": 17398, "price": 2499 },  // Large            │
│       { "id": 17402, "price": 2499 },  // XL               │
│       { "id": 17406, "price": 2999 },  // 2XL (+$5)        │
│       { "id": 17409, "price": 3499 }   // 3XL (+$10)       │
│     ],                                                      │
│     "print_areas": [                                        │
│       {                                                     │
│         "variant_ids": [17390, 17394, ...],                │
│         "placeholders": [                                   │
│           {                                                 │
│             "position": "front",                           │
│             "images": [                                     │
│               {                                             │
│                 "id": "5d39b159b8e7e332",                  │
│                 "x": 0.5,  // Center horizontally          │
│                 "y": 0.4,  // Slightly above center        │
│                 "scale": 0.8,                              │
│                 "angle": 0                                 │
│               }                                             │
│             ]                                               │
│           }                                                 │
│         ]                                                   │
│       }                                                     │
│     ]                                                       │
│   }                                                         │
│                                                             │
│ Step 4.2: Create product in Printify                       │
│   POST https://api.printify.com/v1/shops/{shop_id}/        │
│        products.json                                        │
│                                                             │
│ Step 4.3: Wait for mockup generation                       │
│   • Printify generates mockups asynchronously              │
│   • Poll product endpoint every 5 seconds                  │
│   • Max wait: 60 seconds                                   │
│   • Check for `images` array population                    │
│                                                             │
│ Step 4.4: Validate mockups                                 │
│   • Ensure at least 1 mockup image exists                  │
│   • Validate image URLs are accessible                     │
│   • Check mockup quality (dimensions > 800x800)            │
│                                                             │
│ Step 4.5: Update workflow                                  │
│   UPDATE workflows                                          │
│   SET status = 'PRODUCT_CREATED',                          │
│       printify_product_id = '5e16bb44b8e7e300'             │
│   WHERE id = {workflowId}                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 5: SHOPIFY PUBLICATION                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 5.1: Publish product to Shopify                       │
│   POST https://api.printify.com/v1/shops/{shop_id}/        │
│        products/{product_id}/publish.json                   │
│   Body: {                                                   │
│     "title": true,                                          │
│     "description": true,                                    │
│     "images": true,                                         │
│     "variants": true,                                       │
│     "tags": true                                            │
│   }                                                         │
│                                                             │
│ Step 5.2: Extract Shopify product ID                       │
│   Response: {                                               │
│     "external_id": "shopify:8234567890123"                 │
│   }                                                         │
│   Parse external_id to get Shopify ID                      │
│                                                             │
│ Step 5.3: Verify publication                               │
│   GET https://{shop}.myshopify.com/admin/api/2024-01/      │
│       products/{shopify_id}.json                            │
│   • Verify product exists                                  │
│   • Verify status = "active"                               │
│   • Extract product handle                                 │
│                                                             │
│ Step 5.4: Generate public product URL                      │
│   URL format:                                               │
│   https://branded-fit.myshopify.com/products/{handle}      │
│                                                             │
│ Step 5.5: Update workflow                                  │
│   UPDATE workflows                                          │
│   SET status = 'PUBLISHED',                                │
│       shopify_product_id = '8234567890123',                │
│       product_url = 'https://...'                          │
│   WHERE id = {workflowId}                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 6: WORKFLOW COMPLETION                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 6.1: Final validation                                 │
│   • Verify product URL is accessible                       │
│   • Verify all mockup images loaded                        │
│   • Verify pricing is correct                              │
│                                                             │
│ Step 6.2: Mark workflow complete                           │
│   UPDATE workflows                                          │
│   SET status = 'COMPLETED',                                │
│       completed_at = NOW()                                 │
│   WHERE id = {workflowId}                                  │
│                                                             │
│ Step 6.3: Log success metrics                              │
│   • Total duration                                         │
│   • API calls made                                         │
│   • Cache hit/miss                                          │
│   • Costs incurred                                          │
│                                                             │
│ Step 6.4: Return result to client                          │
│   {                                                         │
│     "success": true,                                        │
│     "workflowId": "clx123abc",                             │
│     "productUrl": "https://...",                           │
│     "mockupImages": [...],                                 │
│     "brandName": "Google",                                 │
│     "duration": 45.2,  // seconds                          │
│     "status": "COMPLETED"                                   │
│   }                                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

### Error Categories

#### 1. Client Errors (4xx)
**Cause:** Invalid user input or request

**Examples:**
- Empty company name
- Invalid domain format
- Blacklisted company

**Handling:**
```typescript
class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

// Usage
if (!companyName || companyName.trim().length === 0) {
  throw new ValidationError('Company name is required');
}
```

**Response:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Company name is required",
  "details": {
    "field": "companyName",
    "provided": ""
  }
}
```

---

#### 2. Logo Not Found (404)
**Cause:** Brandfetch doesn't have the logo

**Handling:**
```typescript
class LogoNotFoundError extends Error {
  statusCode = 404;
  code = 'LOGO_NOT_FOUND';

  constructor(domain: string) {
    super(`Logo not found for domain: ${domain}`);
    this.domain = domain;
  }
}

// Service layer
async findLogo(domain: string): Promise<LogoResult> {
  try {
    const response = await this.brandfetchClient.get(`/brands/${domain}`);
    return this.processLogoResponse(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      // Generate fallback logo
      return this.generateFallbackLogo(domain);
    }
    throw error;
  }
}
```

**Fallback Strategy:**
```typescript
generateFallbackLogo(domain: string): LogoResult {
  const companyName = domain.split('.')[0];
  const initials = companyName.substring(0, 2).toUpperCase();
  const color = this.generateColorFromString(companyName);

  // Generate SVG with initials
  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="500" fill="${color}"/>
      <text x="250" y="300" font-family="Arial" font-size="200"
            fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `;

  return {
    buffer: Buffer.from(svg),
    brandName: this.capitalizeCompanyName(companyName),
    isFallback: true
  };
}
```

---

#### 3. Rate Limiting (429)
**Cause:** API quota exceeded

**Handling:**
```typescript
class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`);
    this.retryAfter = retryAfter;
  }
}

// Retry logic with exponential backoff
async callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] ||
                          Math.pow(2, i) * 1000; // Exponential backoff
        await this.sleep(retryAfter);
        continue;
      }

      throw error; // Non-retryable error
    }
  }

  throw new RateLimitError(60);
}
```

---

#### 4. API Integration Failures (5xx)
**Cause:** External API downtime or errors

**Handling:**
```typescript
class ExternalAPIError extends Error {
  statusCode = 502;
  code = 'EXTERNAL_API_ERROR';
  service: string;

  constructor(service: string, originalError: Error) {
    super(`${service} API error: ${originalError.message}`);
    this.service = service;
    this.originalError = originalError;
  }
}

// Circuit breaker pattern
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > 60000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= 5) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened', {
        failureCount: this.failureCount
      });
    }
  }
}
```

---

#### 5. Workflow Failures
**Cause:** Partial completion, inconsistent state

**Handling:**
```typescript
class WorkflowError extends Error {
  statusCode = 500;
  code = 'WORKFLOW_ERROR';
  workflowId: string;
  stage: WorkflowStatus;

  constructor(workflowId: string, stage: WorkflowStatus, error: Error) {
    super(`Workflow failed at stage ${stage}: ${error.message}`);
    this.workflowId = workflowId;
    this.stage = stage;
    this.originalError = error;
  }
}

// Workflow service with transaction-like behavior
async createProduct(companyName: string): Promise<WorkflowResult> {
  const workflow = await this.createWorkflowRecord(domain);

  try {
    // Each stage updates the workflow status
    const logo = await this.executeStage(
      workflow.id,
      'LOGO_FOUND',
      () => this.logoService.findLogo(domain)
    );

    const imageUpload = await this.executeStage(
      workflow.id,
      'IMAGE_UPLOADED',
      () => this.printifyService.uploadImage(logo.buffer, `${domain}.png`)
    );

    // ... more stages

    return this.completeWorkflow(workflow.id, result);

  } catch (error) {
    // Mark workflow as failed but preserve state
    await this.failWorkflow(workflow.id, error);

    // Cleanup resources if needed
    await this.cleanup(workflow.id);

    throw new WorkflowError(workflow.id, workflow.status, error);
  }
}

private async executeStage<T>(
  workflowId: string,
  status: WorkflowStatus,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn();
    await this.updateWorkflowStatus(workflowId, status);
    return result;
  } catch (error) {
    logger.error('Stage failed', {
      workflowId,
      status,
      error: error.message
    });
    throw error;
  }
}
```

---

### Global Error Handler Middleware

```typescript
// middleware/errorHandler.ts
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with context
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // Determine status code and error code
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';

  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    errorCode = error.code;
  } else if (error instanceof LogoNotFoundError) {
    statusCode = error.statusCode;
    errorCode = error.code;
  } else if (error instanceof RateLimitError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    res.setHeader('Retry-After', error.retryAfter);
  } else if (error instanceof WorkflowError) {
    statusCode = error.statusCode;
    errorCode = error.code;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};
```

---

## Security Considerations

### 1. API Key Management

**Environment Variables:**
```bash
# .env
BRANDFETCH_API_KEY=bf_xxxxxxxxxxxxxxxxxxxxxxxxxx
PRINTIFY_API_TOKEN=ey...
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxx
SHOPIFY_SHOP_NAME=branded-fit

DATABASE_URL=postgresql://user:pass@localhost:5432/branded_fit
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
```

**Validation:**
```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  BRANDFETCH_API_KEY: z.string().min(1),
  PRINTIFY_API_TOKEN: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().startsWith('shpat_'),
  SHOPIFY_SHOP_NAME: z.string().min(1),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

export const env = envSchema.parse(process.env);
```

---

### 2. Input Validation & Sanitization

**Domain Validation:**
```typescript
// utils/validation.ts
import { z } from 'zod';

export const companyNameSchema = z
  .string()
  .min(1, 'Company name is required')
  .max(100, 'Company name too long')
  .trim()
  .refine(
    (val) => !/[<>\"']/.test(val),
    'Company name contains invalid characters'
  );

export const domainSchema = z
  .string()
  .regex(
    /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
    'Invalid domain format'
  );
```

**SQL Injection Prevention:**
```typescript
// Using Prisma ORM (parameterized queries)
const workflow = await prisma.workflow.create({
  data: {
    domain: sanitizedDomain,
    status: 'STARTED'
  }
});
// Prisma automatically prevents SQL injection
```

---

### 3. Rate Limiting

**Express Rate Limiter:**
```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createProductLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP per 15 minutes
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many product creation requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to routes
app.post('/api/products/create', createProductLimiter, productController.create);
```

**Redis-Based Rate Limiting (Advanced):**
```typescript
class RateLimiter {
  constructor(private redis: Redis) {}

  async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    return current <= limit;
  }
}

// Usage
const limiter = new RateLimiter(redis);
const allowed = await limiter.checkLimit(`ratelimit:${ip}`, 10, 900);

if (!allowed) {
  throw new RateLimitError(900);
}
```

---

### 4. CORS Configuration

```typescript
// app.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://branded-fit.com', 'https://www.branded-fit.com']
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

### 5. HTTPS & SSL/TLS

**Production Deployment:**
- Use reverse proxy (Nginx) with SSL termination
- Obtain SSL certificate via Let's Encrypt
- Enforce HTTPS redirects
- Set HSTS headers

```typescript
// middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 6. Secrets Management

**Development:**
- Use `.env` files (never commit to git)
- Add `.env` to `.gitignore`
- Provide `.env.example` template

**Production:**
- Use environment variables from hosting platform
- Consider secrets management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

---

### 7. Logging & Monitoring

**Security-Focused Logging:**
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Audit logging
export const auditLog = (action: string, metadata: any) => {
  logger.info('AUDIT', {
    action,
    timestamp: new Date(),
    ...metadata
  });
};
```

**What to Log:**
- Authentication attempts
- API key usage
- Rate limit violations
- Failed requests
- Workflow failures
- Unusual patterns

**What NOT to Log:**
- API keys/tokens
- Passwords
- Personal identifying information (PII)
- Credit card numbers

---

## Testing Strategy

### 1. Unit Tests

**Logo Service Tests:**
```typescript
// tests/unit/services/logo.service.test.ts
describe('LogoService', () => {
  let service: LogoService;
  let mockAxios: jest.Mocked<typeof axios>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockAxios = axios as any;
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn()
    } as any;

    service = new LogoService(mockAxios, mockCache);
  });

  describe('findLogo', () => {
    it('should return cached logo if available', async () => {
      const cachedLogo = {
        domain: 'google.com',
        logoUrl: 'https://...',
        brandName: 'Google'
      };

      mockCache.get.mockResolvedValue(cachedLogo);

      const result = await service.findLogo('google.com');

      expect(result).toEqual(cachedLogo);
      expect(mockCache.get).toHaveBeenCalledWith('logo:google.com');
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from Brandfetch on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockAxios.get.mockResolvedValue({
        data: {
          name: 'Google',
          logos: [
            {
              formats: [
                {
                  src: 'https://logo.png',
                  format: 'png'
                }
              ]
            }
          ]
        }
      });

      const result = await service.findLogo('google.com');

      expect(result.brandName).toBe('Google');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should generate fallback logo on 404', async () => {
      mockCache.get.mockResolvedValue(null);
      mockAxios.get.mockRejectedValue({
        response: { status: 404 }
      });

      const result = await service.findLogo('unknowncompany.com');

      expect(result.isFallback).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });
});
```

**Target: 80%+ code coverage**

---

### 2. Integration Tests

**API Endpoint Tests:**
```typescript
// tests/integration/api/product.test.ts
describe('POST /api/products/create', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.workflow.deleteMany();
  });

  it('should create a product successfully', async () => {
    const response = await request(app)
      .post('/api/products/create')
      .send({ companyName: 'Google' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      workflowId: expect.any(String),
      status: 'STARTED'
    });

    const workflow = await prisma.workflow.findUnique({
      where: { id: response.body.workflowId }
    });

    expect(workflow).toBeDefined();
    expect(workflow!.domain).toBe('google.com');
  });

  it('should return validation error for empty company name', async () => {
    const response = await request(app)
      .post('/api/products/create')
      .send({ companyName: '' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'VALIDATION_ERROR'
    });
  });

  it('should handle rate limiting', async () => {
    // Make 11 requests (limit is 10)
    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post('/api/products/create')
        .send({ companyName: `company${i}` });

      if (i < 10) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.error).toBe('TOO_MANY_REQUESTS');
      }
    }
  });
});
```

---

### 3. End-to-End Tests

**Full Workflow Test:**
```typescript
// tests/e2e/product-creation.test.ts
describe('Product Creation E2E', () => {
  let workflowId: string;

  it('should create a complete product from company name', async () => {
    // Step 1: Initiate product creation
    const createResponse = await request(app)
      .post('/api/products/create')
      .send({ companyName: 'Stripe' })
      .expect(200);

    workflowId = createResponse.body.workflowId;

    // Step 2: Poll workflow status until completion
    let workflow;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2s = 60s timeout

    while (attempts < maxAttempts) {
      const statusResponse = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .expect(200);

      workflow = statusResponse.body;

      if (workflow.status === 'COMPLETED') {
        break;
      }

      if (workflow.status === 'FAILED') {
        throw new Error(`Workflow failed: ${workflow.error}`);
      }

      await sleep(2000);
      attempts++;
    }

    // Step 3: Verify completion
    expect(workflow.status).toBe('COMPLETED');
    expect(workflow.productUrl).toMatch(/https:\/\/.*\.myshopify\.com\/products\/.*/);
    expect(workflow.shopifyId).toBeDefined();
    expect(workflow.printifyId).toBeDefined();

    // Step 4: Verify product is accessible
    const productResponse = await axios.get(workflow.productUrl);
    expect(productResponse.status).toBe(200);
    expect(productResponse.data).toContain('Stripe Branded T-Shirt');
  }, 120000); // 2 minute timeout

  afterAll(async () => {
    // Cleanup: Delete test product from Shopify
    if (workflowId) {
      // Implementation depends on Shopify API access
    }
  });
});
```

---

### 4. Test Companies

**Tier 1: Fortune 500 (High Success Expected)**
- Google (google.com)
- Apple (apple.com)
- Microsoft (microsoft.com)
- Amazon (amazon.com)
- Meta (meta.com)
- Tesla (tesla.com)
- Netflix (netflix.com)
- Nike (nike.com)
- Coca-Cola (coca-cola.com)
- McDonald's (mcdonalds.com)

**Tier 2: Tech Startups (Medium Success Expected)**
- Stripe (stripe.com)
- Notion (notion.so)
- Figma (figma.com)
- Vercel (vercel.com)
- Linear (linear.app)
- Supabase (supabase.com)
- Railway (railway.app)

**Tier 3: Edge Cases (Fallback Expected)**
- newstartup2026.com (non-existent)
- mylocalbusiness.com (small business)
- test-company-xyz.com (test domain)

**Success Criteria:**
- Tier 1: 100% success rate
- Tier 2: 90%+ success rate
- Tier 3: Graceful fallback to generated logos

---

## Deployment Guide

### Option 1: Docker Compose (Recommended for MVP)

**Prerequisites:**
- Docker 24.x+
- Docker Compose 2.x+
- 4GB RAM minimum
- 10GB disk space

**Setup Steps:**

1. **Clone repository**
```bash
git clone https://github.com/entonomy-dev/branded-fit.git
cd branded-fit
```

2. **Configure environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your API keys
nano backend/.env
```

3. **Build and start services**
```bash
docker-compose up -d --build
```

4. **Run database migrations**
```bash
docker-compose exec backend npm run prisma:migrate
```

5. **Verify deployment**
```bash
curl http://localhost:8080/api/health
# Should return: {"status":"healthy"}

# Open browser
open http://localhost:3000
```

**Docker Compose Configuration:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/branded_fit
      REDIS_URL: redis://redis:6379
      BRANDFETCH_API_KEY: ${BRANDFETCH_API_KEY}
      PRINTIFY_API_TOKEN: ${PRINTIFY_API_TOKEN}
      SHOPIFY_ACCESS_TOKEN: ${SHOPIFY_ACCESS_TOKEN}
      SHOPIFY_SHOP_NAME: ${SHOPIFY_SHOP_NAME}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: branded_fit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: branded-fit-network
```

---

### Option 2: Cloud Deployment (Production Ready)

**Architecture:**
```
                    ┌─────────────────┐
                    │  Cloudflare CDN │
                    │    (DNS/SSL)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Vercel/Netlify│
                    │    (Frontend)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Railway/Render │
                    │    (Backend)     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
    │ Supabase│         │ Upstash │        │ External│
    │   (DB)  │         │ (Redis) │        │   APIs  │
    └─────────┘         └─────────┘        └─────────┘
```

**Services:**

**Frontend: Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
VITE_API_URL=https://api.branded-fit.com
```

**Backend: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
cd backend
railway init

# Add services
railway add postgresql
railway add redis

# Set environment variables
railway variables set BRANDFETCH_API_KEY=...
railway variables set PRINTIFY_API_TOKEN=...
railway variables set SHOPIFY_ACCESS_TOKEN=...

# Deploy
railway up
```

**Database: Supabase**
- Sign up at https://supabase.com
- Create new project
- Copy connection string
- Run migrations via Prisma

**Redis: Upstash**
- Sign up at https://upstash.com
- Create Redis database
- Copy REDIS_URL

---

### Monitoring & Observability

**Health Checks:**
```typescript
// routes/health.routes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      brandfetch: await checkBrandfetchHealth(),
      printify: await checkPrintifyHealth(),
      shopify: await checkShopifyHealth()
    }
  };

  const allHealthy = Object.values(health.services).every(s => s === 'healthy');

  res.status(allHealthy ? 200 : 503).json(health);
});
```

**Logging:**
- Centralized logging with Winston
- Log aggregation with Logtail or Papertrail
- Error tracking with Sentry

**Metrics:**
- Request rate and latency
- API success/failure rates
- Cache hit/miss ratios
- Workflow completion times
- Cost per product created

---

## MVP Scope & Limitations

### In Scope

✅ **Single Product Type**
- Bella+Canvas 3001 Unisex Jersey T-Shirt
- White color only
- Sizes: S, M, L, XL, 2XL, 3XL

✅ **Logo Placement**
- Front center placement
- Automatic sizing (80% of print area)
- Single logo per product

✅ **Automation**
- Automatic logo retrieval
- Automatic mockup generation
- Automatic Shopify listing
- Real-time progress tracking

✅ **Error Handling**
- Graceful fallbacks for missing logos
- Retry logic for API failures
- User-friendly error messages

✅ **Basic Features**
- Single company name input
- Live product URL generation
- Product preview with mockups
- Status tracking

---

### Out of Scope (Future Enhancements)

❌ **Advanced Features**
- Multiple product types (hoodies, hats, etc.)
- Multiple colors
- Custom logo placement
- Bulk product creation
- User accounts/authentication
- Payment processing (orders go through Shopify)
- Inventory management
- Order tracking

❌ **Advanced Integrations**
- Multiple Shopify stores
- Multiple print providers
- Alternative logo sources
- Social media integration
- Analytics dashboard

❌ **Enterprise Features**
- White-label solution
- Multi-tenancy
- Custom branding
- SLA guarantees
- Dedicated support

---

### Known Limitations

**Logo Retrieval:**
- Dependent on Brandfetch database coverage
- May not find logos for very new companies
- Fallback logos are text-based (not high quality)

**Print Quality:**
- Limited to Printify's print quality standards
- No control over print provider selection
- No proof approval process

**Pricing:**
- Fixed pricing model ($24.99 base)
- No dynamic pricing based on logo complexity
- No volume discounts

**Performance:**
- 45-60 second workflow completion time
- Limited to 10 concurrent workflows
- No background job processing

**Scalability:**
- Not optimized for high volume (>100 products/day)
- Single database instance
- No CDN for static assets

---

## Timeline & Milestones

### Week 1: Foundation (Feb 12-18)
**Deliverables:**
- Project structure initialized
- Docker environment running
- Database schema created
- Core dependencies installed
- Environment configuration complete

**Success Criteria:**
- All services start with `docker-compose up`
- Database migrations run successfully
- Health check endpoint returns 200

---

### Week 2-3: Core Services (Feb 19 - Mar 4)
**Deliverables:**
- Logo service implemented and tested
- Printify service implemented and tested
- Shopify service implemented and tested
- Cache service implemented
- Unit tests written (>80% coverage)

**Success Criteria:**
- Can retrieve logo for "Google" from Brandfetch
- Can upload image to Printify
- Can create product in Printify
- Can verify product in Shopify
- All tests pass

---

### Week 3-4: Workflow Orchestration (Mar 5-11)
**Deliverables:**
- Workflow orchestrator implemented
- Database models finalized
- End-to-end workflow functional
- Error handling and retry logic
- Integration tests written

**Success Criteria:**
- Complete workflow from "Google" → Shopify product URL
- Workflow state persisted in database
- Failed workflows marked as FAILED with error details
- Can retry failed workflows

---

### Week 4: API Layer (Mar 12-18)
**Deliverables:**
- RESTful API endpoints implemented
- Request/response validation
- Rate limiting configured
- API documentation (Swagger)
- Postman collection

**Success Criteria:**
- POST /api/products/create returns workflow ID
- GET /api/workflows/:id returns current status
- Rate limiting blocks excessive requests
- All endpoints documented

---

### Week 5: Frontend (Mar 19-25)
**Deliverables:**
- React application built
- Product creation form
- Real-time progress tracking
- Product preview page
- Responsive design

**Success Criteria:**
- User can enter company name and see progress
- Progress updates in real-time
- Final product URL displayed with mockup images
- Works on mobile devices

---

### Week 6: Testing (Mar 26 - Apr 1)
**Deliverables:**
- Comprehensive test suite
- 50+ test companies validated
- Performance testing complete
- Bug fixes implemented
- Test report generated

**Success Criteria:**
- 95%+ success rate for Fortune 500 companies
- Average workflow time < 60 seconds
- All critical bugs fixed
- Test report shows green across all tiers

---

### Week 7: Documentation & Deployment (Apr 2-8)
**Deliverables:**
- Complete documentation set
- Deployed to production environment
- Monitoring configured
- Operations runbook
- Handoff to team lead

**Success Criteria:**
- MVP accessible at public URL
- Documentation covers setup, API, deployment
- Health checks passing
- Monitoring dashboard active

---

## Technical Risks & Mitigation

### Risk 1: API Rate Limits
**Probability:** High
**Impact:** High

**Risk:**
- Brandfetch: 5,000 requests/month on Growth plan
- If MVP gains traction, could exceed quota quickly

**Mitigation:**
- Implement aggressive caching (30-day TTL)
- Monitor usage with alerts at 70% threshold
- Upgrade to higher tier if needed
- Implement queue system for burst traffic

---

### Risk 2: Logo Quality Issues
**Probability:** Medium
**Impact:** Medium

**Risk:**
- Retrieved logos may be low quality
- Logos may not have transparent backgrounds
- Fallback logos look unprofessional

**Mitigation:**
- Validate logo dimensions before use (min 500x500)
- Implement image optimization pipeline
- Improve fallback logo design with SVG generation
- Consider manual review queue for edge cases

---

### Risk 3: Printify Mockup Delays
**Probability:** Medium
**Impact:** Medium

**Risk:**
- Mockup generation can take 30-60 seconds
- Unpredictable timing affects UX
- Potential timeouts

**Mitigation:**
- Implement polling with exponential backoff
- Set realistic timeout (90 seconds)
- Show estimated time remaining to user
- Cache generated mockups for reuse

---

### Risk 4: Shopify API Changes
**Probability:** Low
**Impact:** High

**Risk:**
- Shopify may deprecate API version
- Breaking changes could stop production

**Mitigation:**
- Use latest stable API version (2024-01)
- Monitor Shopify changelog
- Implement API version detection
- Abstract Shopify integration for easy swapping

---

### Risk 5: Cost Overruns
**Probability:** Medium
**Impact:** Medium

**Risk:**
- API costs scale with usage
- Unexpected high volume could be expensive

**Mitigation:**
- Set budget alerts
- Implement daily spending caps
- Cache aggressively
- Monitor cost per product metric
- Consider alternative pricing models

**Cost Projections:**
```
Low Volume (10 products/day):
- Brandfetch: $129/month (5K requests, assuming 50% cache hit)
- Printify: $0/month (only pay on fulfillment)
- Shopify: $29/month
- Total: $158/month

Medium Volume (100 products/day):
- Brandfetch: $129-259/month (may need upgrade)
- Printify: $0/month
- Shopify: $29/month
- Total: $158-288/month

High Volume (1000 products/day):
- Brandfetch: Enterprise pricing needed
- Printify: $0/month
- Shopify: $79/month (upgrade recommended)
- Total: $500-1000+/month
```

---

### Risk 6: Security Vulnerabilities
**Probability:** Medium
**Impact:** High

**Risk:**
- API key exposure
- SQL injection
- XSS attacks
- DDoS attacks

**Mitigation:**
- Never commit secrets to git
- Use parameterized queries (Prisma ORM)
- Sanitize all user input
- Implement rate limiting
- Use HTTPS everywhere
- Regular security audits
- Dependency vulnerability scanning

---

### Risk 7: Scalability Bottlenecks
**Probability:** High (if successful)
**Impact:** High

**Risk:**
- Single database instance
- No load balancing
- No horizontal scaling

**Mitigation:**
- Design for statelessness
- Use Redis for distributed caching
- Implement job queue for async processing
- Monitor performance metrics
- Plan migration to microservices if needed
- Document scaling strategy

**Scaling Path:**
```
Phase 1 (MVP): Single server
- Backend: 1 instance
- Database: 1 instance
- Redis: 1 instance
- Capacity: ~100 products/day

Phase 2 (Growth): Vertical scaling
- Backend: 2-4 instances with load balancer
- Database: Managed PostgreSQL with replicas
- Redis: Managed Redis with clustering
- Capacity: ~1000 products/day

Phase 3 (Scale): Horizontal scaling
- Backend: Auto-scaling (10+ instances)
- Database: Sharding/partitioning
- Redis: Distributed cache
- Message queue: RabbitMQ/SQS
- Capacity: 10,000+ products/day
```

---

## Future Enhancements

### Phase 2: Product Expansion
- Add more t-shirt colors (black, navy, heather gray)
- Add hoodies
- Add hats
- Add multiple logo placement options
- Allow logo customization (size, position, rotation)

### Phase 3: User Experience
- User authentication and accounts
- Save product history
- Bulk product creation
- CSV import for multiple companies
- Product collections/categories

### Phase 4: Business Features
- Custom pricing per product
- Volume discounts
- Affiliate program integration
- White-label solution for agencies
- Multi-store management

### Phase 5: Advanced Automation
- AI-powered logo enhancement
- Automatic color matching
- Smart product recommendations
- Automated marketing copy generation
- Social media post generation

### Phase 6: Analytics & Insights
- Sales dashboard
- Popular companies tracking
- Conversion analytics
- A/B testing framework
- Customer insights

---

## Conclusion

This MVP technical specification provides a comprehensive roadmap for building Branded Fit's core automated workflow. The system is designed with production-readiness in mind while maintaining MVP scope and timeline constraints.

**Key Success Factors:**
1. Focus on core workflow automation
2. Robust error handling and fallbacks
3. Comprehensive testing strategy
4. Clear documentation for handoff
5. Scalability considerations from day one

**Next Steps:**
1. Review and approve this specification
2. Provision external API accounts (Brandfetch, Printify, Shopify)
3. Begin Phase 1 implementation
4. Set up project management and tracking
5. Schedule weekly progress reviews

**Estimated MVP Delivery:** April 8, 2026 (7 weeks from start)

---

## Appendix A: Environment Variables

```bash
# Backend .env
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/branded_fit

# Redis
REDIS_URL=redis://localhost:6379

# Brandfetch API
BRANDFETCH_API_KEY=bf_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Printify API
PRINTIFY_API_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
PRINTIFY_SHOP_ID=12345678

# Shopify API
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SHOP_NAME=branded-fit
SHOPIFY_API_VERSION=2024-01

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key

# Monitoring (optional)
SENTRY_DSN=https://...
LOGTAIL_TOKEN=...
```

---

## Appendix B: API Reference

### POST /api/products/create
Create a new branded product.

**Request:**
```json
{
  "companyName": "Google"
}
```

**Response (Success):**
```json
{
  "success": true,
  "workflowId": "clx123abc",
  "status": "STARTED",
  "message": "Product creation started"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Company name is required"
}
```

---

### GET /api/workflows/:id
Get workflow status and details.

**Response:**
```json
{
  "id": "clx123abc",
  "domain": "google.com",
  "brandName": "Google",
  "status": "COMPLETED",
  "productUrl": "https://branded-fit.myshopify.com/products/google-branded-t-shirt",
  "mockupImages": [
    "https://images-api.printify.com/mockup/...",
    "https://images-api.printify.com/mockup/..."
  ],
  "createdAt": "2026-02-12T12:00:00Z",
  "completedAt": "2026-02-12T12:00:45Z",
  "duration": 45.2,
  "timeline": [
    {"status": "STARTED", "timestamp": "2026-02-12T12:00:00Z"},
    {"status": "LOGO_FOUND", "timestamp": "2026-02-12T12:00:05Z"},
    {"status": "IMAGE_UPLOADED", "timestamp": "2026-02-12T12:00:15Z"},
    {"status": "PRODUCT_CREATED", "timestamp": "2026-02-12T12:00:35Z"},
    {"status": "PUBLISHED", "timestamp": "2026-02-12T12:00:40Z"},
    {"status": "COMPLETED", "timestamp": "2026-02-12T12:00:45Z"}
  ]
}
```

---

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T12:00:00Z",
  "uptime": 86400,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "brandfetch": "healthy",
    "printify": "healthy",
    "shopify": "healthy"
  },
  "version": "1.0.0"
}
```

---

## Appendix C: Troubleshooting Guide

### Issue: "Logo not found"
**Cause:** Brandfetch doesn't have logo for domain
**Solution:** System automatically generates fallback logo with initials

### Issue: "Rate limit exceeded"
**Cause:** Too many API requests
**Solution:** Wait for rate limit window to reset (check Retry-After header)

### Issue: "Mockup generation timeout"
**Cause:** Printify taking longer than expected
**Solution:** Retry the request, mockup may be cached

### Issue: "Product not appearing in Shopify"
**Cause:** Publication delay or API error
**Solution:** Check workflow status, verify Shopify credentials

### Issue: "Database connection error"
**Cause:** PostgreSQL not running or misconfigured
**Solution:** Check DATABASE_URL, ensure database is running

---

**Document End** | Word Count: 16,847 | Date: February 12, 2026
