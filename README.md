# Chile Event Scrapers

Centralized event scraping system for Chile - collecting events from multiple sources into a unified database.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
```

Configure `.env.local` with your Supabase credentials.

## Usage

```bash
# Run single scraper
npm run scrape:puntoticket

# Run all scrapers
npm run scrape:all

# Run with visible browser (debugging)
HEADLESS=false npm run scrape:puntoticket
```

## Architecture

```
src/
├── lib/           # Shared utilities
├── scrapers/      # Individual scrapers
│   └── puntoticket/
├── post-processing/  # Validation, enrichment, deduplication
└── run-all.js
```

## Adding New Scrapers

1. Create folder in `src/scrapers/{source-name}/`
2. Implement `scraper.js` with `scrape()` export
3. Create `index.js` entry point
4. Add to `src/run-all.js` SCRAPERS array
5. Add GitHub Actions job in `.github/workflows/scrape.yml`

## Database Schema (events_v2)

- Multi-image support with dimensions
- Separate venue/address/comuna fields
- Multi-date event occurrences (JSONB)
- Price range (min/max)
- Bilingual categories (Spanish/English)
