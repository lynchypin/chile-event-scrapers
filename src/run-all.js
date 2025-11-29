import 'dotenv/config';
import { logger } from './lib/logger.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRAPERS = [
  { name: 'puntoticket', path: './scrapers/puntoticket/index.js' }
];

async function runScraper(scraper) {
  return new Promise((resolve, reject) => {
    logger.info(`Starting scraper: ${scraper.name}`);
    
    const child = spawn('node', [path.join(__dirname, scraper.path)], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logger.info(`Scraper ${scraper.name} completed successfully`);
        resolve({ name: scraper.name, success: true });
      } else {
        logger.error(`Scraper ${scraper.name} failed with code ${code}`);
        resolve({ name: scraper.name, success: false, code });
      }
    });
    
    child.on('error', (err) => {
      logger.error(`Scraper ${scraper.name} error`, { error: err.message });
      resolve({ name: scraper.name, success: false, error: err.message });
    });
  });
}

async function main() {
  logger.info('='.repeat(60));
  logger.info('Running all scrapers');
  logger.info('='.repeat(60));
  
  const results = [];
  
  for (const scraper of SCRAPERS) {
    const result = await runScraper(scraper);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  logger.info('='.repeat(60));
  logger.info('All scrapers complete');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  logger.info(`Successful: ${successful}, Failed: ${failed}`);
  
  results.forEach(r => {
    logger.info(`  ${r.name}: ${r.success ? 'SUCCESS' : 'FAILED'}`);
  });
  
  logger.info('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main();
