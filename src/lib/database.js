import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { logger } from './logger.js';

let supabase = null;

export function getSupabaseClient() {
  if (!supabase) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    }
    supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  }
  return supabase;
}

export async function checkExistingEvent(externalId, source) {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from(config.supabase.table)
    .select('id, external_id, scraped_at, start_date')
    .eq('external_id', externalId)
    .eq('source', source)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    logger.error(`Error checking existing event: ${error.message}`);
    return null;
  }
  
  return data;
}

export async function shouldScrapeEvent(externalId, source) {
  const existing = await checkExistingEvent(externalId, source);
  
  if (!existing) {
    return { shouldScrape: true, reason: 'new_event' };
  }
  
  const now = new Date();
  const eventDate = existing.start_date ? new Date(existing.start_date) : null;
  
  if (eventDate && eventDate < now) {
    return { shouldScrape: false, reason: 'past_event' };
  }
  
  return { shouldScrape: false, reason: 'already_exists', existingId: existing.id };
}

export async function upsertEvent(eventData) {
  const client = getSupabaseClient();
  
  const now = new Date().toISOString();
  const record = {
    ...eventData,
    updated_at: now,
    scraped_at: now
  };
  
  const { data, error } = await client
    .from(config.supabase.table)
    .upsert(record, {
      onConflict: 'external_id,source',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  if (error) {
    logger.error(`Error upserting event: ${error.message}`, { externalId: eventData.external_id });
    throw error;
  }
  
  logger.info(`Upserted event: ${eventData.title}`, { id: data.id });
  return data;
}

export async function bulkUpsertEvents(events) {
  const client = getSupabaseClient();
  
  const now = new Date().toISOString();
  const records = events.map(event => ({
    ...event,
    updated_at: now,
    scraped_at: now
  }));
  
  const { data, error } = await client
    .from(config.supabase.table)
    .upsert(records, {
      onConflict: 'external_id,source',
      ignoreDuplicates: false
    })
    .select();
  
  if (error) {
    logger.error(`Error bulk upserting events: ${error.message}`);
    throw error;
  }
  
  logger.info(`Bulk upserted ${data.length} events`);
  return data;
}

export async function getExistingEventIds(source) {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from(config.supabase.table)
    .select('external_id')
    .eq('source', source)
    .gte('start_date', new Date().toISOString());
  
  if (error) {
    logger.error(`Error fetching existing event IDs: ${error.message}`);
    return new Set();
  }
  
  return new Set(data.map(e => e.external_id));
}
