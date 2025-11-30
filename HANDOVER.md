# Chile Event Scrapers - System Handover & Blueprint

## Overview

This project is a **modular event scraping system** designed to collect event data from multiple Chilean ticketing platforms and store them in a centralized Supabase database. It is one component of a larger event aggregation pipeline.

**Repository:** `lynchypin/chile-event-scrapers`  
**Database:** Supabase (`events_v2` table)  
**Runtime:** Node.js 20+  
**Scraping Engine:** Playwright with stealth plugins

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (Scheduled)                   │
│                     - Daily at 06:00 UTC                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Scraper Runner                            │
│                     src/run-all.js                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │PuntoTicket│    │ Future   │    │ Future   │
         │ Scraper  │    │ Scraper  │    │ Scraper  │
         └──────────┘    └──────────┘    └──────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Libraries (src/lib/)                   │
│  browser.js │ database.js │ parsers.js │ images.js │ logger.js │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│                     Table: events_v2                            │
│              Unique Key: (external_id, source)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
chile-event-scrapers/
├── .github/workflows/
│   ├── scrape.yml          # Main scraper workflow (daily)
│   └── pipeline.yml        # Legacy/alternative pipeline
├── src/
│   ├── lib/                # Shared utilities
│   │   ├── browser.js      # Playwright browser setup with stealth
│   │   ├── config.js       # Centralized configuration
│   │   ├── database.js     # Supabase client & CRUD operations
│   │   ├── images.js       # Image extraction & validation
│   │   ├── logger.js       # Winston logger with scoped logging
│   │   └── parsers.js      # Date, price, category parsing
│   ├── scrapers/
│   │   └── puntoticket/    # PuntoTicket scraper module
│   │       ├── index.js    # Entry point with CLI args
│   │       └── scraper.js  # Core scraping logic
│   ├── post-processing/
│   │   └── validate.js     # Data validation utilities
│   └── run-all.js          # Run all scrapers sequentially
├── .env.local              # Local environment variables (not committed)
├── package.json
└── HANDOVER.md             # This document
```

---

## Database Schema (events_v2)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `external_id` | text | Source-specific event ID (from URL slug) |
| `source` | text | Scraper source name (e.g., 'puntoticket') |
| `source_url` | text | Original scraped URL |
| `title` | text | Event title (cleaned) |
| `description` | text | Short description |
| `long_description` | text | Full event details |
| `start_date` | timestamp | Event start datetime |
| `end_date` | timestamp | Event end datetime |
| `event_occurrences` | jsonb | Multiple date/time occurrences |
| `venue` | text | Venue name |
| `address` | text | Full address |
| `comuna` | text | Chilean commune |
| `region` | text | Region |
| `location` | text | Combined location string |
| `latitude` | numeric | GPS latitude |
| `longitude` | numeric | GPS longitude |
| `image_url` | text | Best/primary image URL |
| `images` | jsonb | Array of all extracted images |
| `category_original` | text | Original category from source |
| `category_english` | text | Normalized English category |
| `price` | text | Original price text (e.g., "$ 25.000") |
| `price_min` | integer | Minimum price in CLP |
| `price_max` | integer | Maximum price in CLP |
| `currency` | text | Currency code (default: 'CLP') |
| `homepage_url` | text | Event's canonical page URL |
| `ticket_url` | text | Direct ticket purchase URL |
| `is_active` | boolean | Whether event is active |
| `is_popular` | boolean | Popularity flag |
| `likes` | integer | Like count |
| `validation_status` | text | 'pending', 'validated', 'rejected' |
| `scraped_at` | timestamp | Last scrape timestamp |
| `last_checked_at` | timestamp | Last validation check |
| `scrape_version` | text | Scraper version (e.g., '2.1') |
| `raw_data` | jsonb | Original scraped data for debugging |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Last update time |

**Unique Constraint:** `(external_id, source)` - enables upsert behavior

---

## Current Scrapers

### 1. PuntoTicket (`src/scrapers/puntoticket/`)

**Status:** ✅ Production Ready  
**Source URL:** https://www.puntoticket.com  
**Schedule:** Daily at 06:00 UTC  

**What it scrapes:**
- All events from `/todos` page
- Category pages: `/musica`, `/deportes`, `/teatro`, `/familia`, `/especiales`
- Individual event pages for detailed data

**Data Extraction:**
- **Title:** `<h1>` or `og:title` meta tag
- **Description:** `og:description` or `.event-description`
- **Price:** `.precio-total` selector (PuntoTicket-specific)
- **Image:** `og:image` meta tag, then `img[src*="ptocdn.net"]`
- **Dates:** Various date selectors, parsed with date-fns
- **Venue/Location:** `.venue`, `.lugar` selectors

**Anti-Detection:**
- Playwright with `puppeteer-extra-plugin-stealth`
- Randomized user agents
- Human-like delays (2-5 seconds between requests)
- Infinite scroll handling

**CLI Options:**
```bash
# Run with limit
node src/scrapers/puntoticket/index.js --limit=10

# Dry run (no database writes)
node src/scrapers/puntoticket/index.js --dry-run

# Force headful browser
HEADLESS=false node src/scrapers/puntoticket/index.js
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (not anon key) |
| `HEADLESS` | No | Set to 'false' for visible browser (default: true) |
| `LOG_LEVEL` | No | Winston log level (default: 'info') |

**Local Setup:**
```bash
# Create .env.local file
SUPABASE_URL=https://dgwgdmvndwafedbfafcj.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-key
```

**GitHub Actions:**
- Secrets configured at: `Settings > Secrets and variables > Actions`
- Required secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

---

## GitHub Actions Workflows

### scrape.yml (Primary)
- **Trigger:** Daily at 06:00 UTC, manual dispatch
- **Jobs:**
  1. `scrape-puntoticket` - Runs PuntoTicket scraper
  2. `notify-completion` - Reports results
- **Timeout:** 60 minutes
- **Artifacts:** Logs uploaded on failure

### pipeline.yml (Legacy)
- Python-based gatherer (separate system)
- Runs every 12 hours
- Uses `gatherer.py` and `events.db`

---

## Adding a New Scraper

### Step 1: Create Scraper Directory
```bash
mkdir -p src/scrapers/newsource
touch src/scrapers/newsource/index.js
touch src/scrapers/newsource/scraper.js
```

### Step 2: Implement Scraper (scraper.js)
```javascript
import { createStealthBrowser, humanDelay, safeGoto } from '../../lib/browser.js';
import { createScopedLogger } from '../../lib/logger.js';
import { getExistingEventIds, upsertEvent } from '../../lib/database.js';
import { extractExternalId, parsePrice, parseDateRange } from '../../lib/parsers.js';

const log = createScopedLogger('newsource');

const CONFIG = {
  baseUrl: 'https://www.newsource.com',
  source: 'newsource',
  eventLinkSelector: 'a[href*="/event/"]'
};

export async function scrape(options = {}) {
  const { browser, context } = await createStealthBrowser({ headless: options.headless !== false });
  const page = await context.newPage();
  const results = { scraped: 0, skipped: 0, errors: 0, events: [] };
  
  try {
    // 1. Get existing events to avoid re-scraping
    const existingIds = await getExistingEventIds(CONFIG.source);
    
    // 2. Navigate and collect event links
    await safeGoto(page, CONFIG.baseUrl);
    const eventLinks = await page.$$eval(CONFIG.eventLinkSelector, els => els.map(e => e.href));
    
    // 3. Filter to new events only
    const newLinks = eventLinks.filter(link => !existingIds.has(extractExternalId(link)));
    
    // 4. Scrape each event page
    for (const link of newLinks) {
      const eventData = await scrapeEventPage(context, link);
      if (eventData) {
        await upsertEvent(eventData);
        results.scraped++;
      }
      await humanDelay(2000, 4000);
    }
    
  } finally {
    await browser.close();
  }
  
  return results;
}

async function scrapeEventPage(context, url) {
  // Implement page-specific extraction
  // Return object matching events_v2 schema
}

export default { scrape, CONFIG };
```

### Step 3: Create Entry Point (index.js)
```javascript
import { scrape } from './scraper.js';
import { logger } from '../../lib/logger.js';

const options = {
  headless: process.env.HEADLESS !== 'false',
  limit: process.argv.includes('--limit') 
    ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
    : null,
  dryRun: process.argv.includes('--dry-run')
};

logger.info('============================================================');
logger.info('NewSource Scraper - Starting');
logger.info('============================================================');

scrape(options)
  .then(results => {
    logger.info('Scraping Complete');
    logger.info(`Scraped: ${results.scraped}`);
    logger.info(`Errors: ${results.errors}`);
    process.exit(results.errors > 0 ? 1 : 0);
  })
  .catch(error => {
    logger.error('Scraper failed', { error: error.message });
    process.exit(1);
  });
```

### Step 4: Add npm Script
```json
{
  "scripts": {
    "scrape:newsource": "node src/scrapers/newsource/index.js"
  }
}
```

### Step 5: Add to GitHub Actions
```yaml
# In .github/workflows/scrape.yml
scrape-newsource:
  if: ${{ github.event.inputs.scraper == 'newsource' || github.event.inputs.scraper == 'all' || github.event_name == 'schedule' }}
  runs-on: ubuntu-latest
  timeout-minutes: 60
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install chromium --with-deps
    - name: Run NewSource scraper
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        HEADLESS: 'true'
      run: npm run scrape:newsource
```

---

## Shared Library Reference

### browser.js
- `createStealthBrowser(options)` - Returns `{ browser, context }` with stealth plugins
- `humanDelay(min, max)` - Random delay between actions
- `scrollToBottom(page, options)` - Handle infinite scroll pages
- `safeGoto(page, url, options)` - Navigate with retry logic
- `safeClick(page, selector)` - Click with error handling

### database.js
- `getSupabaseClient()` - Singleton Supabase client
- `getExistingEventIds(source)` - Returns `Set<string>` of external IDs
- `checkExistingEvent(externalId, source)` - Check if event exists
- `shouldScrapeEvent(externalId, source)` - Determine if re-scrape needed
- `upsertEvent(eventData)` - Insert or update event
- `bulkUpsertEvents(events)` - Batch upsert

### parsers.js
- `extractExternalId(url)` - Extract ID from URL slug
- `cleanTitle(title)` - Remove prefixes, normalize text
- `mapCategory(category)` - Map Spanish to English categories
- `parsePrice(text)` - Returns `{ text, min, max, currency }`
- `parseDateRange(text)` - Returns `{ start, end, occurrences }`
- `parseTime(text)` - Extract time from string
- `normalizeUrl(url, baseUrl)` - Make relative URLs absolute

### images.js
- `extractAllImages(page, selectors)` - Get all images from page
- `selectBestImage(images)` - Pick highest quality image
- `isHighQualityImage(img)` - Validate image dimensions

### logger.js
- `logger` - Winston logger instance
- `createScopedLogger(scope)` - Logger with `[scope]` prefix

---

## Common Issues & Solutions

### 1. Scraper blocked / CAPTCHA
- Increase delays in `config.scraping.minDelay/maxDelay`
- Rotate user agents more frequently
- Consider residential proxies for production

### 2. Missing data fields
- Check selector accuracy with browser DevTools
- Source sites may change HTML structure
- Add fallback selectors for resilience

### 3. GitHub Actions timeout
- Default timeout is 60 minutes
- Increase `timeout-minutes` if needed
- Consider splitting large scrapers into batches

### 4. Database connection issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check Supabase project isn't paused
- Verify `events_v2` table exists

### 5. Playwright browser issues
- Ensure `npx playwright install chromium --with-deps` runs
- GitHub Actions needs `--with-deps` for system dependencies

---

## Monitoring & Debugging

### Local Testing
```bash
# Full run
npm run scrape:puntoticket

# Limited run for testing
node src/scrapers/puntoticket/index.js --limit=5

# Visible browser for debugging
HEADLESS=false node src/scrapers/puntoticket/index.js --limit=3

# Check database
# Use Supabase dashboard or SQL editor
```

### GitHub Actions
- View runs at: `https://github.com/lynchypin/chile-event-scrapers/actions`
- Failed runs upload `scraper-logs` artifact
- Manual trigger via `workflow_dispatch`

### Database Queries
```sql
-- Recent events by source
SELECT title, price, image_url, created_at 
FROM events_v2 
WHERE source = 'puntoticket' 
ORDER BY created_at DESC 
LIMIT 10;

-- Events missing images
SELECT title, source_url 
FROM events_v2 
WHERE image_url IS NULL AND source = 'puntoticket';

-- Event count by source
SELECT source, COUNT(*) as count 
FROM events_v2 
GROUP BY source;
```

---

## Potential Future Scrapers

| Source | URL | Priority | Notes |
|--------|-----|----------|-------|
| Ticketmaster Chile | ticketmaster.cl | High | Major concerts |
| Passline | passline.com | High | Sports, concerts |
| Entradas.cl | entradas.cl | Medium | Theater, shows |
| Eventbrite Chile | eventbrite.cl | Medium | Various events |
| Feria Ticket | feriaticket.cl | Low | Local events |

---

## Contact & Maintenance

**Last Updated:** 2025-11-30  
**Scraper Version:** 2.1  
**Maintainer:** [Your Name]

For issues or questions, check GitHub Issues or create a new issue with:
1. Scraper name
2. Error logs
3. Steps to reproduce
