import { config } from './config.js';
import { parse, format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function cleanTitle(rawTitle) {
  if (!rawTitle) return null;
  
  let title = rawTitle.trim();
  
  const shouldKeep = config.titlePatternsToKeep.some(pattern => pattern.test(title));
  
  if (!shouldKeep) {
    for (const prefix of config.titlePrefixesToRemove) {
      title = title.replace(prefix, '');
    }
  }
  
  title = title.replace(/\s+/g, ' ').trim();
  
  return title || rawTitle.trim();
}

export function mapCategory(spanishCategory) {
  if (!spanishCategory) return null;
  
  const normalized = spanishCategory.trim();
  return config.categoryMapping[normalized] || null;
}

export function parsePrice(priceText) {
  if (!priceText) return { text: null, min: null, max: null, currency: 'CLP' };
  
  const text = priceText.trim();
  
  if (/gratis|free/i.test(text)) {
    return { text: 'Gratis', min: 0, max: 0, currency: 'CLP' };
  }
  
  const numbers = text.match(/[\d.,]+/g);
  if (!numbers || numbers.length === 0) {
    return { text, min: null, max: null, currency: 'CLP' };
  }
  
  const parsedNumbers = numbers.map(n => {
    const cleaned = n.replace(/\./g, '').replace(',', '.');
    return parseInt(cleaned, 10);
  }).filter(n => !isNaN(n) && n > 0);
  
  if (parsedNumbers.length === 0) {
    return { text, min: null, max: null, currency: 'CLP' };
  }
  
  const sorted = parsedNumbers.sort((a, b) => a - b);
  
  return {
    text,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    currency: 'CLP'
  };
}

const SPANISH_MONTHS = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
  'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
  'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3,
  'may': 4, 'jun': 5, 'jul': 6, 'ago': 7,
  'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
};

export function parseSpanishDate(dateStr, year = new Date().getFullYear()) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.toLowerCase().trim()
    .replace(/^(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo),?\s*/i, '')
    .replace(/\s+de\s+/g, ' ')
    .replace(/\s+/g, ' ');
  
  const patterns = [
    /(\d{1,2})\s+(\w+)\s+(\d{4})/,
    /(\d{1,2})\s+(\w+)/,
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const [, day, monthStr, yearStr] = match;
        const month = SPANISH_MONTHS[monthStr.toLowerCase()];
        if (month !== undefined) {
          return new Date(parseInt(yearStr), month, parseInt(day));
        }
      } else if (pattern === patterns[1]) {
        const [, day, monthStr] = match;
        const month = SPANISH_MONTHS[monthStr.toLowerCase()];
        if (month !== undefined) {
          const date = new Date(year, month, parseInt(day));
          if (date < new Date()) {
            date.setFullYear(year + 1);
          }
          return date;
        }
      } else if (pattern === patterns[2] || pattern === patterns[3]) {
        const [, day, month, yearStr] = match;
        const fullYear = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
        return new Date(fullYear, parseInt(month) - 1, parseInt(day));
      }
    }
  }
  
  try {
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) return parsed;
  } catch {}
  
  return null;
}

export function parseDateRange(dateStr) {
  if (!dateStr) return { start: null, end: null, occurrences: [] };
  
  const cleaned = dateStr.trim();
  
  const rangeMatch = cleaned.match(/(\d{1,2})\s*(?:de\s+)?(\w+)?\s*[-–al]+\s*(\d{1,2})\s+(?:de\s+)?(\w+)(?:\s+(\d{4}))?/i);
  
  if (rangeMatch) {
    const [, startDay, startMonth, endDay, endMonth, year] = rangeMatch;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startMonthNum = SPANISH_MONTHS[(startMonth || endMonth).toLowerCase()];
    const endMonthNum = SPANISH_MONTHS[endMonth.toLowerCase()];
    
    if (startMonthNum !== undefined && endMonthNum !== undefined) {
      let startDate = new Date(targetYear, startMonthNum, parseInt(startDay));
      let endDate = new Date(targetYear, endMonthNum, parseInt(endDay));
      
      if (startDate < new Date() && !year) {
        startDate.setFullYear(targetYear + 1);
        endDate.setFullYear(targetYear + 1);
      }
      
      return { start: startDate, end: endDate, occurrences: [] };
    }
  }
  
  const multiMatch = cleaned.match(/(\d{1,2}),?\s*(\d{1,2})?,?\s*(?:y\s+)?(\d{1,2})?\s+(?:de\s+)?(\w+)(?:\s+(\d{4}))?/i);
  
  if (multiMatch) {
    const [, day1, day2, day3, month, year] = multiMatch;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const monthNum = SPANISH_MONTHS[month.toLowerCase()];
    
    if (monthNum !== undefined) {
      const occurrences = [day1, day2, day3]
        .filter(Boolean)
        .map(d => {
          const date = new Date(targetYear, monthNum, parseInt(d));
          return {
            date: format(date, 'yyyy-MM-dd'),
            start_time: null,
            end_time: null
          };
        });
      
      return {
        start: parseSpanishDate(`${day1} ${month} ${targetYear}`),
        end: occurrences.length > 1 ? parseSpanishDate(`${occurrences[occurrences.length - 1].date.split('-')[2]} ${month} ${targetYear}`) : null,
        occurrences
      };
    }
  }
  
  const singleDate = parseSpanishDate(cleaned);
  return { start: singleDate, end: null, occurrences: [] };
}

export function parseTime(timeStr) {
  if (!timeStr) return null;
  
  const match = timeStr.match(/(\d{1,2})[:\.](\d{2})\s*(hrs?|am|pm)?/i);
  if (match) {
    let [, hours, minutes, period] = match;
    hours = parseInt(hours);
    
    if (period && /pm/i.test(period) && hours < 12) {
      hours += 12;
    } else if (period && /am/i.test(period) && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return null;
}

export function extractExternalId(url) {
  if (!url) return null;
  
  const patterns = [
    /\/evento\/([^\/\?]+)/,
    /\/event\/([^\/\?]+)/,
    /id=([^&]+)/,
    /\/([^\/]+)\/?$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return url;
}

export function normalizeUrl(url, baseUrl) {
  if (!url) return null;
  
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return new URL(url, baseUrl).href;
  
  return new URL(url, baseUrl).href;
}
