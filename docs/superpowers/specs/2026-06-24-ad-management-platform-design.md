# AI-Powered Ad Management Platform - System Design

> **Status:** Design Phase  
> **Date:** 2026-06-24  
> **MVP Target:** 2026-07-08 (2 weeks)

---

## Executive Summary

A unified advertising management platform for e-commerce sellers that consolidates Facebook Ads, Google Ads, and competitor intelligence into a single dashboard. MVP focuses on **Campaign Management + AI Copy Generation + Competitor Monitoring** for two platforms (Facebook + Google), with automatic optimization and hourly data sync.

**Core Value Proposition:** 
- Reduce campaign management time by 70% (1 platform instead of 3+ tools)
- Generate creative copy variants from competitor analysis (10+ angles automatically)
- Auto-optimize budget allocation without manual intervention

---

## 1. Product Scope

### 1.1 MVP Phase 1 (Weeks 1-2)

**Included Features:**
- ✅ Multi-account management (Facebook + Google Ads)
- ✅ Campaign CRUD (Create, Read, Update, Delete)
- ✅ AI-powered copy generation (5-10 variants per angle)
- ✅ Competitor ad scraping (hourly)
- ✅ Competitor angle extraction
- ✅ Auto-optimizer (hourly rules-based)
- ✅ Unified analytics dashboard
- ✅ User authentication & subscription management
- ✅ Email notifications
- ✅ Basic reporting

**Excluded (Future Phases):**
- ❌ TikTok Ads (Phase 2)
- ❌ SEO tools (Phase 2)
- ❌ AI image/video generation (Phase 2)
- ❌ Advanced ML optimization (Bayesian, multi-armed bandit)
- ❌ Team collaboration
- ❌ White-label support
- ❌ Mobile app

### 1.2 Success Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| MVP Launch | Week 2 | Fully functional for 2 platforms |
| Time to Create Campaign | < 5 min | Including AI copy generation |
| Campaign Count | 100+ test campaigns | Validated in testing |
| Data Sync Success Rate | 99.5% | Hourly API calls must succeed |
| UI Load Time | < 2s | Dashboard initial load |
| API Response Time | < 500ms | 95th percentile |

---

## 2. User Roles & Use Cases

### 2.1 Primary User: E-commerce Seller

**Profile:**
- Solo operators to small agencies (1-5 people)
- Managing 5-50 ad accounts across platforms
- Monthly ad spend: $500-$10,000
- Pain points:
  - Switching between Facebook Ads Manager, Google Ads, competitor research tools
  - Manual copy writing takes 4-8 hours per week
  - Can't monitor competitor strategies in real-time
  - Inefficient budget allocation (spreads spend evenly)

**Core Workflow:**
1. Input product info → System generates copy variants
2. Select preferred copy + upload image → One-click launch to both platforms
3. System monitors performance hourly → Auto-pauses underperformers
4. Receive daily performance summary + competitor alerts

### 2.2 Admin/Support User (Future)

- Manage user accounts and subscriptions
- Monitor system health and API integrations
- Approve/reject competitor scraping rules

---

## 3. Technical Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│          Frontend Layer (React 18 + TypeScript)          │
│  Dashboard | Campaign Builder | AI Copilot | Analytics   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│         API Gateway & Auth (Supabase)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼────┐ ┌────▼────┐ ┌────▼────────┐
│ PostgreSQL │ │ Redis   │ │ S3 Storage  │
│ (业务数据) │ │ (缓存)  │ │ (配图素材)  │
└────────────┘ └─────────┘ └─────────────┘
        │
  ┌─────┴──────────────────────────────┐
  │   Edge Functions & Cron Jobs        │
  ├─────────────────────────────────────┤
  │ • Campaign Manager                  │
  │ • Competitor Scraper (hourly)       │
  │ • AI Copy Generator                 │
  │ • Auto-Optimizer (hourly)           │
  │ • Analytics Aggregator (hourly)     │
  │ • Notification Service              │
  └─────────────────────────────────────┘
        │
  ┌─────┴──────────────────────────────┐
  │   External API Integrations         │
  ├─────────────────────────────────────┤
  │ • Facebook Graph API v18.0          │
  │ • Google Ads API v14.0              │
  │ • Claude API (gpt-4-turbo)          │
  │ • Puppeteer (Web Scraping)          │
  └─────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18, TypeScript, Vite | Existing codebase; fast iteration |
| **Backend** | Supabase (PostgreSQL + Edge Fn) | Serverless, integrated auth, real-time |
| **Auth** | Supabase Auth | JWT-based, OAuth ready |
| **Async Jobs** | Supabase Cron / Vercel Crons | No additional infrastructure |
| **AI** | Claude API (gpt-4-turbo) | Best accuracy for copywriting |
| **Scraping** | Puppeteer + Node.js | Headless browser for JS-heavy sites |
| **Cache** | Redis (Upstash) | Real-time metrics caching |
| **Storage** | AWS S3 | Scalable asset storage |
| **Monitoring** | Sentry + CloudWatch | Error tracking and performance |
| **Deployment** | Vercel + Supabase | Existing setup, auto-deploy on push |

### 3.3 API Integrations

#### Facebook Graph API
```
Endpoint: https://graph.facebook.com/v18.0
Scope: ads_management, ads_read
Operations:
  - POST /campaigns (create)
  - GET /campaigns/:id (read)
  - POST /campaigns/:id (update)
  - DELETE /campaigns/:id (delete)
  - GET /insights (metrics)
Rate Limit: 200 requests/hour for initial tier
Polling: Hourly for analytics
```

#### Google Ads API
```
Endpoint: https://googleads.googleapis.com/v14
OAuth Flow: service account or user OAuth
Operations:
  - CREATE Campaign
  - UPDATE Campaign
  - MUTATE keywords/ads
  - GET metrics
Rate Limit: 15,000 operations/day per manager account
Polling: Hourly for analytics
```

#### Claude API
```
Model: gpt-4-turbo (claude-opus-4 when available)
Usage: Copy generation, competitor angle extraction
Rate Limit: 100,000 tokens/day (configurable)
Cost Estimate: ~$0.50 per campaign (10 variants × 5k tokens avg)
```

---

## 4. Data Model

### 4.1 Core Tables

```sql
-- Users & Subscription
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  plan_type ENUM('free', 'starter', 'pro', 'enterprise'),
  credits_balance NUMERIC,
  monthly_spend NUMERIC,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Platform Account Connections
CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  platform ENUM('facebook', 'google', 'tiktok'),
  account_id VARCHAR,
  account_name VARCHAR,
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  expires_at TIMESTAMP,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  UNIQUE(user_id, platform, account_id)
);

-- Campaigns (core)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  objective ENUM('conversions', 'traffic', 'awareness'),
  platforms ENUM[] ('facebook', 'google'),
  status ENUM('draft', 'active', 'paused', 'ended'),
  total_budget NUMERIC,
  daily_budget NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Ad Groups
CREATE TABLE ad_groups (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  name VARCHAR,
  platform ENUM('facebook', 'google'),
  platform_id VARCHAR UNIQUE,
  status ENUM('active', 'paused', 'ended'),
  budget NUMERIC,
  created_at TIMESTAMP
);

-- Individual Ads
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  ad_group_id UUID REFERENCES ad_groups(id),
  headline VARCHAR,
  body_text TEXT,
  cta VARCHAR,
  image_url VARCHAR,
  video_url VARCHAR,
  landing_url VARCHAR,
  status ENUM('active', 'paused', 'ended'),
  performance_score NUMERIC (0-100),
  copy_angle VARCHAR,
  ai_generated BOOLEAN,
  created_at TIMESTAMP
);

-- Competitor Ads (scraped data)
CREATE TABLE competitor_ads (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  competitor_name VARCHAR,
  competitor_url VARCHAR,
  ad_text TEXT,
  ad_image_url VARCHAR,
  extracted_angles JSONB,
  cta_type VARCHAR,
  target_audience JSONB,
  scraped_at TIMESTAMP,
  created_at TIMESTAMP
);

-- AI-Generated Copy Variants
CREATE TABLE ai_copies (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  angle VARCHAR,
  variant_num INTEGER,
  headline VARCHAR,
  body_text TEXT,
  cta VARCHAR,
  used_flag BOOLEAN DEFAULT false,
  performance_score NUMERIC,
  created_at TIMESTAMP
);

-- Daily Analytics (aggregated)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  ad_id UUID REFERENCES ads(id),
  analytics_date DATE,
  platform ENUM('facebook', 'google'),
  impressions BIGINT,
  clicks BIGINT,
  spend NUMERIC,
  conversions INTEGER,
  conversion_value NUMERIC,
  ctr NUMERIC,
  cpc NUMERIC,
  roas NUMERIC,
  created_at TIMESTAMP,
  UNIQUE(campaign_id, ad_id, analytics_date, platform)
);

-- Notifications Log
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type ENUM('performance_alert', 'competitor_update', 'optimization_done'),
  title VARCHAR,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

### 4.2 Data Flow Diagram

```
User Input (Product Info)
        ↓
┌───────────────────────┐
│ Campaign Manager      │ → Creates campaign record
└───────────────────────┘
        ↓
┌───────────────────────┐
│ Competitor Scraper    │ → Fetches competitor ads
└───────────────────────┘
        ↓
┌───────────────────────┐
│ AI Copy Generator     │ → Generates 10 variants
└───────────────────────┘
        ↓
User Selects Copy + Image
        ↓
┌───────────────────────┐
│ Publish to Platforms  │ → POST to FB + GA APIs
└───────────────────────┘
        ↓
[Hourly] Analytics Aggregator → Fetches metrics from APIs
        ↓
[Hourly] Auto-Optimizer → Updates ad status based on rules
        ↓
[Hourly] Notification Service → Sends alerts to user
```

---

## 5. Feature Specifications

### 5.1 Campaign Manager

**Purpose:** Create, edit, and manage advertising campaigns across platforms

**Inputs:**
- Product name, description, category
- Target audience (age, interests, geography)
- Budget (total + daily)
- Platforms to deploy (Facebook, Google, or both)

**Process:**
1. Validate inputs
2. Create campaign record in PostgreSQL
3. Fetch 3-5 competitor ads (via Scraper)
4. Extract angles from competitor copy (via Claude API)
5. Generate AI copy variants (via Claude API)
6. Suggest budget split (60% FB, 40% GA default)
7. Recommend image sizes and formats

**Output:**
- Campaign dashboard with AI-generated copy options
- Suggested configurations for each platform

**Error Handling:**
- Invalid budget → Show error, suggest minimum ($5/day)
- No competitor data → Proceed with generic angles
- API timeout → Retry 3 times with exponential backoff

---

### 5.2 AI Copy Generator

**Purpose:** Generate multiple copy angles and variants based on product info and competitor analysis

**Inputs:**
- Campaign data (product, audience)
- Competitor ads (extracted angles)
- User preferences (tone, CTA type)

**Process:**
1. Fetch competitor angles from database
2. Call Claude API with prompt:
   ```
   Product: [name]
   Description: [desc]
   Competitor angles found: [angles]
   
   Generate 5 different marketing angles for this product.
   For each angle, create 3 copy variants (headline + body).
   Format: JSON with angle name, variants[], CTA suggestions
   ```
3. Store generated copies in `ai_copies` table
4. Calculate estimated performance score (heuristic)

**Output:**
```json
{
  "angles": [
    {
      "name": "Cost Savings",
      "variants": [
        {
          "headline": "Save 50% on shipping",
          "body": "Free delivery on all orders over $30"
        },
        {
          "headline": "50% cheaper than competitors",
          "body": "Quality product at half the price"
        }
      ],
      "cta_suggestions": ["Shop Now", "Get Offer"]
    }
  ]
}
```

**Cost Estimate:** $0.50-1.00 per campaign (10 variants)

---

### 5.3 Competitor Scraper

**Purpose:** Monitor competitor ads and extract marketing angles

**Frequency:** Hourly (scheduled cron job)

**Process:**
1. Query `competitor_urls` table for monitored brands
2. Use Puppeteer to navigate ads library (Facebook) or search ads (Google)
3. Extract: ad text, images, CTA, audience targeting (if visible)
4. Store raw data in `competitor_ads` table
5. Call Claude to analyze:
   ```
   Analyze these competitor ads and extract:
   - Marketing angles (5-10)
   - Value propositions
   - CTAs used
   - Target audience signals
   ```
6. Store extracted angles in JSONB
7. Alert user if competitor changed strategy

**Output:**
```json
{
  "competitor_name": "Brand X",
  "angles": ["Free Shipping", "Quality", "Fast Delivery"],
  "ctas": ["Shop Now", "Learn More"],
  "changes_detected": true
}
```

**Rate Limits:**
- Facebook Ads Library: 5 queries/minute
- Google Ads: 100 queries/day
- Max 10 competitors tracked per user

---

### 5.4 Auto-Optimizer

**Purpose:** Automatically optimize campaigns based on performance metrics

**Frequency:** Hourly (scheduled cron job)

**Rules (MVP):**
```
IF ad performance < 50% of campaign average:
  → PAUSE the ad
  → Log action in audit trail
  → Send user notification
  → Transfer budget to top performers

IF campaign still running after 7 days:
  → Check ROAS < 1.0
  → Suggest budget cut or pause
  → Alert user
```

**Process:**
1. Fetch analytics for all active campaigns
2. Calculate averages (CTR, CPC, ROAS per campaign)
3. Apply rules
4. Push changes to platforms via APIs
5. Log all actions
6. Queue notifications

**Constraints:**
- Never pause last ad in campaign
- Never reduce budget below $1/day
- Require user manual confirmation if major changes

---

### 5.5 Analytics Dashboard

**Purpose:** Unified view of campaign performance across platforms

**Metrics Displayed:**
- Total spend (by platform)
- Impressions, Clicks, CTR
- Cost Per Click (CPC)
- Conversions, Conversion Rate
- Return on Ad Spend (ROAS)
- Estimated ROI

**Granularity:**
- By Campaign
- By Ad
- By Platform
- By Angle (AI-generated vs manual)

**Refresh Cadence:**
- Real-time for clicks/impressions (from cache)
- Hourly for conversions (from analytics API)
- Daily for spend (reconciliation)

**Charts:**
- Trend line (7/30/90 day)
- Performance by angle
- Platform comparison
- Budget allocation pie chart

---

## 6. Workflow & User Journeys

### 6.1 Happy Path: Create & Launch Campaign

```
1. User: Click "New Campaign"
   System: Show campaign builder form

2. User: Enter product info
   - Product name: "Blue Wireless Headphones"
   - Description: "Noise-canceling, 48-hour battery"
   - Target: Age 18-35, Interest: Technology
   - Budget: $500/month
   - Platforms: Facebook + Google

3. System: 
   - Queries competitor_ads for "headphones"
   - Extracts angles: [Quality, Price, Features, Reviews]
   - Calls Claude to generate 3 variants per angle (12 total)
   - Displays 12 copy options grouped by angle
   - Time: ~30 seconds

4. User: 
   - Reviews AI copy
   - Selects 3 favorites
   - Uploads product image
   - Confirms targeting

5. System:
   - Creates campaign record
   - Creates ad_groups (1 FB, 1 GA)
   - Creates ads (3 ads in FB group, 3 in GA group)
   - Publishes to both platforms (2 API calls)
   - Status → "active"

6. User:
   - Sees "Campaign Live!" confirmation
   - Redirected to campaign dashboard
   - Views real-time dashboard (shows 0 impressions initially)

7. System (background):
   - Every hour: Fetches analytics from FB + GA APIs
   - Updates analytics_daily table
   - Checks optimizer rules
   - Sends notifications if needed
```

**Time to Live:** < 5 minutes

---

### 6.2 Competitor Alert Flow

```
[Hourly Cron Job]
1. Scraper fetches competitor ads
2. Detects new angle: "Eco-Friendly Materials"
3. Compares to previous data
4. Finds no existing ads from this user with that angle

5. Creates notification:
   Title: "Competitor added new angle"
   Message: "Brand X is now promoting 'Eco-Friendly' - you don't have ads on this angle"
   Action: "Generate ads for this angle"

6. Sends email + in-app notification

7. User clicks → System auto-generates ads for new angle
```

---

### 6.3 Auto-Optimization Flow

```
[Hourly Cron Job]
1. Analytics Aggregator fetches data for all active campaigns
2. Campaign "Blue Headphones" metrics:
   - Ad 1 (Quality angle): CTR=2.5%, CPC=$0.85
   - Ad 2 (Price angle): CTR=4.2%, CPC=$0.52 ← TOP
   - Ad 3 (Features angle): CTR=0.8%, CPC=$1.20 ← BOTTOM

3. Campaign average CTR = 2.5%
   Ad 3 performance = 0.8% = 32% of average

4. Trigger rule: Performance < 50%
   Action: PAUSE Ad 3
   Reason: Low CTR (0.8% vs 2.5% avg)

5. Budget transfer: $10 from Ad 3 → $5 to Ad 2

6. Log action in audit trail

7. Create notification:
   "Ad 'Features angle' paused due to low CTR. 
    Budget moved to top performer (Price angle).
    Review in dashboard or revert here."

8. Send email to user
```

---

## 7. API Specifications

### 7.1 Frontend API Endpoints

**Campaign Endpoints:**
```
POST   /api/campaigns              Create campaign
GET    /api/campaigns              List user's campaigns
GET    /api/campaigns/:id          Get campaign details
PUT    /api/campaigns/:id          Update campaign
DELETE /api/campaigns/:id          Delete campaign

GET    /api/campaigns/:id/analytics Get analytics for campaign
GET    /api/campaigns/:id/ads      Get all ads in campaign
```

**Copy Generation Endpoints:**
```
POST   /api/campaigns/:id/generate-copy   Generate AI copy
GET    /api/campaigns/:id/copies          List generated copies
DELETE /api/campaigns/:id/copies/:copy_id Delete a copy variant
```

**Analytics Endpoints:**
```
GET    /api/analytics/summary             Dashboard summary
GET    /api/analytics/campaigns/:id       Campaign performance
GET    /api/analytics/compare             Compare platforms
```

**Competitor Endpoints:**
```
GET    /api/competitors/ads                List monitored competitors
POST   /api/competitors/monitor            Add competitor to monitor
DELETE /api/competitors/:competitor_id     Stop monitoring
GET    /api/competitors/angles             Extracted angles
```

---

### 7.2 Response Format

**Success (200):**
```json
{
  "status": "success",
  "data": {...},
  "timestamp": "2026-06-24T10:30:00Z"
}
```

**Error (4xx/5xx):**
```json
{
  "status": "error",
  "error": "INVALID_BUDGET",
  "message": "Minimum daily budget is $1",
  "timestamp": "2026-06-24T10:30:00Z"
}
```

---

## 8. Security & Compliance

### 8.1 Authentication
- JWT tokens (Supabase Auth)
- OAuth 2.0 for Facebook/Google integrations
- API key storage: Supabase Vault (encrypted at rest)

### 8.2 Data Protection
- All API tokens encrypted with AES-256
- Row-level security (RLS) in PostgreSQL
- HTTPS only
- No storing of sensitive user data (passwords, CC)

### 8.3 Rate Limiting
- User API: 1,000 requests/hour
- AI copy generation: 100 campaigns/day
- Competitor scraping: 500 competitors/day

### 8.4 Compliance
- GDPR: Data deletion on account termination
- CCPA: User data export endpoint
- Facebook ToS: No spam, valid landing pages only
- Google Ads policies: Ads reviewed before launch (MVP = manual)

---

## 9. Monitoring & Observability

### 9.1 Metrics to Track

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API Response Time | Vercel Analytics | > 1s (95th %ile) |
| Error Rate | Sentry | > 1% |
| Cron Job Failures | CloudWatch | Any failure |
| Facebook API Quota | Custom | > 80% used |
| Database Query Time | Supabase Logs | > 500ms |
| Copy Generation Cost | Custom | > $100/day |

### 9.2 Logging
- All API calls (request, response, latency)
- All cron job executions (start, end, errors)
- All user actions (campaign creation, optimization, etc.)
- All AI API calls (prompt, response, cost)

### 9.3 Alerting
- Slack notifications for critical errors
- Email digest (weekly) for performance summary
- In-app toast alerts for user actions

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Campaign model validation
- Analytics calculation logic
- AI prompt generation
- Copy validation

### 10.2 Integration Tests
- Campaign creation → Facebook API call
- Analytics aggregation (mock API responses)
- Competitor scraper (mock Puppeteer)
- Notification sending

### 10.3 E2E Tests
- Full campaign creation workflow
- Analytics dashboard loads correctly
- Optimization rules trigger correctly
- Competitor alerts sent

### 10.4 Load Testing
- 1,000 campaigns polling analytics simultaneously
- 100 copy generation requests/minute
- 10,000 scraped ads in database

---

## 11. Deployment & Rollout

### 11.1 Deployment Pipeline
```
GitHub Push (main branch)
  ↓
GitHub Actions (run tests)
  ↓
Vercel auto-deploy (frontend)
  ↓
Supabase migrations (if any)
  ↓
Production smoke tests
  ↓
Live to users
```

### 11.2 Environment Strategy
- **Dev:** Local, feature branches
- **Staging:** Staging database, full API integration
- **Production:** Main branch, production database

### 11.3 Rollback Plan
- Keep previous 5 versions deployable
- Database migrations are reversible
- Feature flags for risky changes

---

## 12. Success Criteria (MVP)

**Technical:**
- ✅ All core APIs functional (Campaign, Copy, Analytics)
- ✅ Data sync successful 99%+ of the time
- ✅ Page load < 2 seconds
- ✅ No critical bugs in production

**User:**
- ✅ 5+ beta users successfully launch campaigns
- ✅ Campaign creation < 5 minutes
- ✅ Auto-optimizer makes at least 1 decision per user
- ✅ User satisfaction (NPS) > 50

**Business:**
- ✅ Ready for public beta (Phase 1.5)
- ✅ Cost per campaign < $1
- ✅ No data loss or security incidents

---

## 13. Phase 2+ Roadmap (Out of Scope)

- **TikTok Ads integration**
- **SEO tools (keyword research, rank tracking)**
- **AI image/video generation (DALL-E, Runway)**
- **Advanced optimization (multi-armed bandit, Bayesian)**
- **Team collaboration & approval workflows**
- **Webhooks & Zapier integration**
- **White-label platform**

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **ROAS** | Return on Ad Spend (revenue / ad spend) |
| **CTR** | Click-Through Rate (clicks / impressions) |
| **CPC** | Cost Per Click (spend / clicks) |
| **Edge Function** | Serverless function running on Supabase |
| **Cron Job** | Scheduled task running on a timer |
| **RLS** | Row-Level Security (database-level access control) |
| **Angle** | Marketing angle (e.g., "Cost Savings", "Quality") |

---

## Appendix B: File Structure

```
/src
  /pages
    /campaigns
      CampaignList.tsx
      CampaignDetail.tsx
      CampaignBuilder.tsx
    /analytics
      AnalyticsDashboard.tsx
      CompareView.tsx
  /components
    CampaignForm.tsx
    CopyVariantSelector.tsx
    AnalyticsChart.tsx
    CompetitorAlerts.tsx
  /hooks
    useCampaigns.ts
    useAnalytics.ts
    useAIGeneratedCopy.ts
  /lib
    api/
      campaigns.ts
      analytics.ts
      competitors.ts
    integrations/
      facebook.ts
      google.ts
      claude.ts

/supabase
  /functions
    campaign-manager.ts
    competitor-scraper.ts
    ai-copy-generator.ts
    auto-optimizer.ts
    analytics-aggregator.ts
    notification-service.ts
  /migrations
    001_create_campaigns_tables.sql
    002_create_competitor_tables.sql
    003_create_analytics_tables.sql
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-24  
**Author:** Claude Code  
**Review Status:** Pending User Approval
