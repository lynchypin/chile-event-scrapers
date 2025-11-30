import { createStealthBrowser, humanDelay, scrollToBottom, safeGoto, safeClick } from '../../lib/browser.js';
import { logger, createScopedLogger } from '../../lib/logger.js';
import { getExistingEventIds, upsertEvent } from '../../lib/database.js';
import { cleanTitle, mapCategory, parsePrice, parseDateRange, parseTime, extractExternalId, normalizeUrl } from '../../lib/parsers.js';
import { extractAllImages, selectBestImage, isHighQualityImage } from '../../lib/images.js';
import PQueue from 'p-queue';
import pRetry from 'p-retry';

const log = createScopedLogger('puntoticket');

const CONFIG = {
  baseUrl: 'https://www.puntoticket.com',
  countrySelector: 'a[href*="chile"], .country-chile, [data-country="chile"]',
  allEventsPath: '/todos',
  eventCardSelector: '.event-card, .evento-item, article.event, [class*="event-card"], [class*="evento"]',
  eventLinkSelector: 'a[href*="/evento/"], a[href*="/event/"]',
  source: 'puntoticket',
  maxPages: 100,
  eventsPerPage: 20
};

export async function scrape(options = {}) {
  const { browser, context } = await createStealthBrowser({ headless: options.headless !== false });
  const page = await context.newPage();
  
  const results = { scraped: 0, skipped: 0, errors: 0, events: [] };
  
  try {
    log.info('Starting puntoticket scraper');
    
    const existingIds = await getExistingEventIds(CONFIG.source);
    log.info(`Found ${existingIds.size} existing events in database`);
    
    await navigateToChile(page);
    
    const eventLinks = await collectAllEventLinks(page);
    log.info(`Collected ${eventLinks.length} event links`);
    
    const newLinks = eventLinks.filter(link => {
      const id = extractExternalId(link);
      return !existingIds.has(id);
    });
    
    log.info(`${newLinks.length} new events to scrape (${eventLinks.length - newLinks.length} already exist)`);
    results.skipped = eventLinks.length - newLinks.length;
    
    const queue = new PQueue({ concurrency: 1 });
    
    for (const link of newLinks) {
      queue.add(async () => {
        try {
          const eventData = await pRetry(
            () => scrapeEventPage(context, link),
            { retries: 2, onFailedAttempt: e => log.warn(`Retry ${e.attemptNumber} for ${link}`) }
          );
          
          if (eventData) {
            await upsertEvent(eventData);
            results.scraped++;
            results.events.push(eventData);
          }
        } catch (error) {
          log.error(`Failed to scrape event: ${link}`, { error: error.message });
          results.errors++;
        }
        
        await humanDelay(2000, 4000);
      });
    }
    
    await queue.onIdle();
    
    log.info(`Scraping complete`, results);
    
  } catch (error) {
    log.error('Scraper failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    await browser.close();
  }
  
  return results;
}

async function navigateToChile(page) {
  log.info('Navigating to puntoticket...');
  
  await safeGoto(page, CONFIG.baseUrl);
  await humanDelay(2000, 3000);
  
  const needsCountrySelection = await page.evaluate(() => {
    return document.body.innerText.toLowerCase().includes('selecciona tu país') ||
           document.body.innerText.toLowerCase().includes('select your country') ||
           document.querySelector('[class*="country"]') !== null;
  });
  
  if (needsCountrySelection) {
    log.info('Country selection detected, selecting Chile...');
    
    const chileSelectors = [
      'a[href*="chile"]',
      '[data-country="cl"]',
      '[data-country="chile"]',
      'img[alt*="Chile"]',
      'button:has-text("Chile")',
      'a:has-text("Chile")'
    ];
    
    for (const selector of chileSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          log.info(`Clicked Chile selector: ${selector}`);
          await humanDelay(2000, 3000);
          break;
        }
      } catch {}
    }
  }
  
  await safeGoto(page, CONFIG.baseUrl + CONFIG.allEventsPath);
  await humanDelay(2000, 3000);
  
  log.info('Successfully navigated to events page');
}

async function collectAllEventLinks(page) {
  const links = new Set();
  let pageNum = 1;
  let consecutiveEmptyPages = 0;
  
  log.info('Collecting event links with infinite scroll handling...');
  
  await scrollToBottom(page, {
    maxScrolls: 100,
    scrollDelay: 1500,
    checkSelector: CONFIG.eventCardSelector
  });
  
  const pageLinks = await page.evaluate((linkSelector) => {
    const anchors = document.querySelectorAll(linkSelector);
    return Array.from(anchors).map(a => a.href).filter(href => href && href.includes('/'));
  }, CONFIG.eventLinkSelector);
  
  pageLinks.forEach(link => links.add(link));
  log.info(`Found ${pageLinks.length} event links after scrolling`);
  
  const categories = ['/musica', '/deportes', '/teatro', '/familia', '/especiales'];
  
  for (const category of categories) {
    try {
      await safeGoto(page, CONFIG.baseUrl + category);
      await humanDelay(1500, 2500);
      
      await scrollToBottom(page, { maxScrolls: 50, scrollDelay: 1500 });
      
      const categoryLinks = await page.evaluate((linkSelector) => {
        const anchors = document.querySelectorAll(linkSelector);
        return Array.from(anchors).map(a => a.href).filter(href => href && href.includes('/'));
      }, CONFIG.eventLinkSelector);
      
      const newCount = categoryLinks.filter(l => !links.has(l)).length;
      categoryLinks.forEach(link => links.add(link));
      
      log.info(`Category ${category}: found ${newCount} new links (total: ${links.size})`);
      
    } catch (error) {
      log.warn(`Failed to scrape category ${category}`, { error: error.message });
    }
  }
  
  return Array.from(links);
}

async function scrapeEventPage(context, url) {
  const page = await context.newPage();
  
  try {
    log.debug(`Scraping event: ${url}`);
    
    const success = await safeGoto(page, url, { timeout: 45000 });
    if (!success) {
      throw new Error(`Failed to navigate to ${url}`);
    }
    
    await humanDelay(1500, 2500);
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    const eventData = await page.evaluate(() => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) {
            return el.textContent.trim();
          }
        }
        return null;
      };

      const getAttr = (selectors, attr) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.getAttribute(attr)) {
            return el.getAttribute(attr);
          }
        }
        return null;
      };

      const getAllText = (selectors) => {
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          if (els.length > 0) {
            return Array.from(els).map(el => el.textContent.trim()).filter(Boolean);
          }
        }
        return [];
      };

      const title = getText([
        'h1', '.event-title', '.evento-titulo', '[class*="event-name"]',
        '[class*="event-title"]', '.title', 'meta[property="og:title"]'
      ]) || getAttr(['meta[property="og:title"]'], 'content');

      const description = getText([
        '.event-description', '.evento-descripcion', '[class*="description"]',
        '.description', '.detalle', 'meta[property="og:description"]'
      ]) || getAttr(['meta[property="og:description"]'], 'content');

      const longDescription = getText([
        '.event-details', '.evento-detalles', '[class*="long-description"]',
        '.full-description', '.content-description', 'article'
      ]);

      const venue = getText([
        '.venue', '.lugar', '[class*="venue"]', '[class*="location-name"]',
        '.event-venue', '.recinto', '[class*="place"]'
      ]);

      const address = getText([
        '.address', '.direccion', '[class*="address"]', '.location-address',
        '.event-address', '[class*="ubicacion"]'
      ]);

      const dateText = getText([
        '.event-date', '.fecha', '[class*="date"]', '.when',
        '.event-when', '[class*="fecha"]', 'time'
      ]) || getAttr(['time'], 'datetime');

      const timeText = getText([
        '.event-time', '.hora', '[class*="time"]:not([class*="datetime"])',
        '.when-time', '[class*="hora"]'
      ]);

      // Improved price extraction for PuntoTicket
      let priceText = null;
      const priceEls = document.querySelectorAll('.precio-total, [class*="precio-total"]');
      for (const el of priceEls) {
        const text = el.textContent.trim();
        if (text.includes('$')) {
          priceText = text;
          break;
        }
      }
      if (!priceText) {
        priceText = getText([
          '.price', '.precio', '[class*="price"]', '.event-price',
          '[class*="precio"]', '.ticket-price'
        ]);
      }

      const category = getText([
        '.category', '.categoria', '[class*="category"]',
        '.event-category', '[class*="categoria"]', '.genre'
      ]);

      // Improved image extraction for PuntoTicket
      const images = [];

      // First priority: og:image meta tag (usually highest quality)
      const ogImage = getAttr(['meta[property="og:image"]'], 'content');
      if (ogImage && !ogImage.includes('ico-ticket') && !ogImage.includes('landing-2021')) {
        images.push({ url: ogImage, alt: 'Event Image', width: null, height: null, priority: 1 });
      }

      // Second priority: Event-specific images from ptocdn.net
      const eventImgs = document.querySelectorAll('img[src*="ptocdn.net"], img[src*="eventos"]');
      eventImgs.forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && !src.includes('ico-ticket') && !src.includes('landing-2021') && !src.includes('logo')) {
          images.push({
            url: src,
            alt: img.alt || null,
            width: img.naturalWidth || null,
            height: img.naturalHeight || null,
            priority: 2
          });
        }
      });

      // Third priority: img_artist_thumb class (PuntoTicket specific)
      const artistImg = document.querySelector('img.img_artist_thumb, img.img-responsive');
      if (artistImg) {
        const src = artistImg.src || artistImg.dataset.src;
        if (src && !src.includes('ico-ticket') && !src.includes('landing-2021')) {
          images.push({
            url: src,
            alt: artistImg.alt || null,
            width: artistImg.naturalWidth || null,
            height: artistImg.naturalHeight || null,
            priority: 2
          });
        }
      }

      // Generic image selectors as fallback
      const imgSelectors = [
        '.event-image img', '.evento-imagen img', '[class*="event-image"] img',
        '.gallery img', '.carousel img', 'picture img', '.main-image img',
        'img[class*="event"]', 'img[class*="poster"]', 'figure img'
      ];

      for (const sel of imgSelectors) {
        const imgs = document.querySelectorAll(sel);
        imgs.forEach(img => {
          const src = img.src || img.dataset.src;
          if (src && !src.startsWith('data:') && !src.includes('ico-ticket') && !src.includes('landing-2021') && !src.includes('logo')) {
            images.push({
              url: src,
              alt: img.alt || null,
              width: img.naturalWidth || null,
              height: img.naturalHeight || null,
              priority: 3
            });
          }
        });
      }

      const ticketUrl = getAttr([
        'a[href*="comprar"]', 'a[href*="ticket"]', 'a[href*="entradas"]',
        '.buy-ticket', '.comprar', 'a.btn-primary'
      ], 'href') || window.location.href;

      return {
        title,
        description,
        longDescription,
        venue,
        address,
        dateText,
        timeText,
        priceText,
        category,
        images,
        ticketUrl,
        sourceUrl: window.location.href
      };
    });

    // Filter and select best image - prioritize images from eventData.images which are sorted by priority
    const validImages = (eventData.images || []).filter(img =>
      img.url &&
      !img.url.includes('ico-ticket') &&
      !img.url.includes('landing-2021') &&
      !img.url.includes('logo') &&
      !img.url.includes('facebook.svg') &&
      !img.url.includes('twitter.svg')
    );

    // Sort by priority (lower is better)
    validImages.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Get best image (first one after sorting, or try extractAllImages as fallback)
    let bestImageUrl = validImages.length > 0 ? validImages[0].url : null;

    if (!bestImageUrl) {
      const extractedImages = await extractAllImages(page, [
        'img[src*="ptocdn.net"]', 'img[src*="eventos"]', 'img.img_artist_thumb',
        '.event-image img', '.evento-imagen img', 'picture img'
      ]);
      const bestExtracted = selectBestImage(extractedImages);
      bestImageUrl = bestExtracted?.url || null;
    }

    const dateInfo = parseDateRange(eventData.dateText);
    const priceInfo = parsePrice(eventData.priceText);
    const time = parseTime(eventData.timeText);

    if (dateInfo.start && time) {
      const [hours, minutes] = time.split(':');
      dateInfo.start.setHours(parseInt(hours), parseInt(minutes));
    }

    const externalId = extractExternalId(url);
    const cleanedTitle = cleanTitle(eventData.title);

    const locationParts = [eventData.venue, eventData.address].filter(Boolean);
    const comuna = extractComuna(eventData.address || eventData.venue || '');

    const formattedEvent = {
      external_id: externalId,
      source: CONFIG.source,
      source_url: url,

      title: cleanedTitle,
      description: eventData.description,
      long_description: eventData.longDescription,

      start_date: dateInfo.start ? dateInfo.start.toISOString() : null,
      end_date: dateInfo.end ? dateInfo.end.toISOString() : null,
      event_occurrences: dateInfo.occurrences.length > 0 ? dateInfo.occurrences : null,

      venue: eventData.venue,
      address: eventData.address,
      comuna: comuna,
      location: locationParts.join(', ') || null,

      image_url: bestImageUrl,
      images: validImages.length > 0 ? validImages : null,

      category_original: eventData.category,
      category_english: mapCategory(eventData.category),

      price: priceInfo.text,
      price_min: priceInfo.min,
      price_max: priceInfo.max,
      currency: priceInfo.currency,

      homepage_url: url,
      ticket_url: eventData.ticketUrl ? normalizeUrl(eventData.ticketUrl, CONFIG.baseUrl) : url,

      validation_status: 'pending',
      scrape_version: '2.1',
      raw_data: eventData
    };
    
    log.info(`Scraped: ${cleanedTitle}`, { externalId });
    
    return formattedEvent;
    
  } catch (error) {
    log.error(`Error scraping ${url}`, { error: error.message });
    throw error;
  } finally {
    await page.close();
  }
}

function extractComuna(text) {
  if (!text) return null;
  
  const comunas = [
    'Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 'La Reina',
    'Peñalolén', 'La Florida', 'Macul', 'San Miguel', 'San Joaquín', 'La Granja',
    'Lo Espejo', 'Pedro Aguirre Cerda', 'San Ramón', 'La Pintana', 'El Bosque',
    'La Cisterna', 'San Bernardo', 'Puente Alto', 'Maipú', 'Cerrillos', 'Estación Central',
    'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Renca', 'Quilicura',
    'Colina', 'Lampa', 'Huechuraba', 'Conchalí', 'Independencia', 'Recoleta',
    'Viña del Mar', 'Valparaíso', 'Concón', 'Antofagasta', 'Temuco', 'Puerto Montt',
    'Punta Arenas', 'La Serena', 'Coquimbo', 'Arica', 'Iquique', 'Talca', 'Chillán',
    'Concepción', 'Talcahuano', 'Rancagua', 'Curicó', 'Osorno', 'Valdivia'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const comuna of comunas) {
    if (lowerText.includes(comuna.toLowerCase())) {
      return comuna;
    }
  }
  
  return null;
}

export default { scrape, CONFIG };
