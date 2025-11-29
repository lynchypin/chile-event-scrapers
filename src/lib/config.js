import 'dotenv/config';

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    table: 'events_v2'
  },
  
  scraping: {
    minDelay: 2000,
    maxDelay: 5000,
    pageTimeout: 60000,
    maxRetries: 3,
    concurrency: 2,
    userAgents: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ]
  },
  
  categoryMapping: {
    'Música': 'Music',
    'Conciertos': 'Concerts',
    'Teatro': 'Theater',
    'Deportes': 'Sports',
    'Familia': 'Family',
    'Especiales': 'Special Events',
    'Festivales': 'Festivals',
    'Humor': 'Comedy',
    'Danza': 'Dance',
    'Exposiciones': 'Exhibitions',
    'Cine': 'Cinema',
    'Infantil': 'Kids'
  },
  
  titlePrefixesToRemove: [
    /^Cinema:\s*/i,
    /^Cine:\s*/i,
    /^Concert[o]?:\s*/i,
    /^Concierto:\s*/i,
    /^Teatro:\s*/i,
    /^Theater:\s*/i,
    /^Show:\s*/i,
    /^Espectáculo:\s*/i,
    /^Evento:\s*/i,
    /^Event:\s*/i
  ],
  
  titlePatternsToKeep: [
    /tribute/i,
    /tributo/i,
    /homenaje/i,
    /cover/i,
    /sinfónico/i,
    /symphonic/i,
    /orquesta/i,
    /orchestra/i
  ]
};

export function getRandomUserAgent() {
  return config.scraping.userAgents[Math.floor(Math.random() * config.scraping.userAgents.length)];
}

export function getRandomDelay() {
  return Math.floor(Math.random() * (config.scraping.maxDelay - config.scraping.minDelay)) + config.scraping.minDelay;
}
