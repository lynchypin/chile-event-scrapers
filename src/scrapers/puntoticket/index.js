import 'dotenv/config';
import { scrape } from './scraper.js';
import { logger } from '../../lib/logger.js';

async function main() {
  const startTime = Date.now();
  
  logger.info('='.repeat(60));
  logger.info('PuntoTicket Scraper - Starting');
  logger.info('='.repeat(60));
  
  try {
    const headless = process.env.HEADLESS !== 'false';
    
    const results = await scrape({ headless });
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    logger.info('='.repeat(60));
    logger.info('Scraping Complete');
    logger.info(`Duration: ${duration} minutes`);
    logger.info(`Events scraped: ${results.scraped}`);
    logger.info(`Events skipped: ${results.skipped}`);
    logger.info(`Errors: ${results.errors}`);
    logger.info('='.repeat(60));
    
    process.exit(results.errors > 0 ? 1 : 0);
    
  } catch (error) {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();
