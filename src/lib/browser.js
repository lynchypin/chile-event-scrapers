import { chromium } from 'playwright';
import { config, getRandomUserAgent, getRandomDelay } from './config.js';
import { logger } from './logger.js';

export async function createStealthBrowser(options = {}) {
  const userAgent = options.userAgent || getRandomUserAgent();
  
  const browser = await chromium.launch({
    headless: options.headless !== false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1920, height: 1080 },
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    geolocation: { latitude: -33.4489, longitude: -70.6693 },
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
  });
  
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ]
    });
    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-CL', 'es', 'en-US', 'en']
    });
    
    Object.defineProperty(navigator, 'platform', {
      get: () => 'MacIntel'
    });
    
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8
    });
    
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: Notification.permission });
      }
      return originalQuery(parameters);
    };
    
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
    
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.apply(this, arguments);
    };
  });
  
  logger.debug('Created stealth browser', { userAgent: userAgent.substring(0, 50) + '...' });
  
  return { browser, context };
}

export async function humanDelay(min, max) {
  const delay = min && max 
    ? Math.floor(Math.random() * (max - min)) + min
    : getRandomDelay();
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function scrollToBottom(page, options = {}) {
  const { maxScrolls = 50, scrollDelay = 1000, checkSelector = null } = options;
  
  let previousHeight = 0;
  let scrollCount = 0;
  let noChangeCount = 0;
  
  while (scrollCount < maxScrolls) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    if (currentHeight === previousHeight) {
      noChangeCount++;
      if (noChangeCount >= 3) {
        logger.debug(`Scroll complete after ${scrollCount} scrolls - no more content`);
        break;
      }
    } else {
      noChangeCount = 0;
    }
    
    previousHeight = currentHeight;
    
    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });
    
    await humanDelay(scrollDelay, scrollDelay + 500);
    scrollCount++;
    
    if (checkSelector) {
      const elements = await page.$$(checkSelector);
      logger.debug(`Scroll ${scrollCount}: Found ${elements.length} elements`);
    }
  }
  
  return scrollCount;
}

export async function waitForCloudflare(page, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isChallenge = await page.evaluate(() => {
      return document.body.innerText.includes('Checking your browser') ||
             document.body.innerText.includes('Just a moment') ||
             document.body.innerText.includes('Verificando tu navegador') ||
             document.querySelector('#challenge-running') !== null ||
             document.querySelector('.cf-browser-verification') !== null;
    });
    
    if (!isChallenge) {
      logger.debug('Cloudflare challenge passed or not present');
      return true;
    }
    
    logger.debug('Waiting for Cloudflare challenge...');
    await humanDelay(1000, 2000);
  }
  
  logger.warn('Cloudflare challenge timeout');
  return false;
}

export async function safeClick(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, { timeout: options.timeout || 10000 });
    await humanDelay(200, 500);
    await page.click(selector);
    await humanDelay(500, 1000);
    return true;
  } catch (error) {
    logger.debug(`Click failed for selector: ${selector}`, { error: error.message });
    return false;
  }
}

export async function safeGoto(page, url, options = {}) {
  const maxRetries = options.retries || 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || config.scraping.pageTimeout
      });
      
      await waitForCloudflare(page);
      return true;
    } catch (error) {
      logger.warn(`Navigation attempt ${attempt}/${maxRetries} failed: ${url}`, { error: error.message });
      
      if (attempt < maxRetries) {
        await humanDelay(2000, 5000);
      }
    }
  }
  
  return false;
}
