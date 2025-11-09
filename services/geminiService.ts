import { EventItem, AdItem } from '../types';
/*
const fetchEvents = async (language: 'es' | 'en'): Promise<EventItem[]> => {
  try {
    // In a production app, data is often pre-generated and stored as a static asset.
    // This avoids making expensive API calls on every page load, providing a faster
    // and more reliable user experience.
    const response = await fetch(`/data/events_${language}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    let data = await response.json();
    let events: EventItem[] = data.events;
    
    // To ensure the demo app is timeless, dynamically update event dates.
    // If an event's date is in the past, its year is incremented until it's in the future.
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for a consistent daily comparison
    events = events.map(event => {
      // Using replace to parse 'YYYY-MM-DD' as a local date, not UTC, to prevent timezone issues.
      let eventStartDate = new Date(event.event_date_iso);
      // If no end date, treat it as the same as the start date for calculations.
      let eventEndDate = event.endDate ? new Date(event.endDate.replace(/-/g, '/')) : new Date(eventStartDate);
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      // If the event's end date is in the past, shift the years for both start and end dates.
      if (eventEndDate < today) {
        const yearsToAdd = today.getFullYear() - eventEndDate.getFullYear();
        eventStartDate.setFullYear(eventStartDate.getFullYear() + yearsToAdd);
        eventEndDate.setFullYear(eventEndDate.getFullYear() + yearsToAdd);
        
        // If it's still in the past (e.g., today is Dec 2024, event was Jan 2023), add one more year.
        if (eventEndDate < today) {
            eventStartDate.setFullYear(eventStartDate.getFullYear() + 1);
            eventEndDate.setFullYear(eventEndDate.getFullYear() + 1);
        }
      }
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      return {
        ...event,
        event_date_iso: eventStartDate.toISOString(),
        // Only return endDate if it existed in the original object
        ...(event.endDate && { endDate: formatDate(eventEndDate) })
      };
    });
    
    // Sort events by date, as they might not be sorted in the static file.
    return events.sort((a, b) => new Date(a.event_date_iso).getTime() - new Date(b.event_date_iso).getTime());

  } catch (error) {
    console.error("Error fetching static event data:", error);
    // Provide a more user-friendly error message
    throw new Error("Could not load event data. Please try refreshing the page.");
  }
};
*/

const fetchEvents = async (language: 'es' | 'en'): Promise<EventItem[]> => {
  try {
    // 1. Fetch the data structure from the file, which is { last_updated, event_count, events[] }
    const response = await fetch(`/data/events_${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    const data = await response.json();

    // 2. Extract the actual array of events
    const events: EventItem[] = data.events;

    // 3. Sort events by the correct date field 'event_date_iso'.
    // The pipeline already prunes past events, so no date shifting is needed for the live app.
    // The sorting is still a good practice.
    return events.sort((a, b) => new Date(a.event_date_iso).getTime() - new Date(b.event_date_iso).getTime());

  } catch (error) {
    console.error("Error fetching static event data:", error);
    // Provide a more user-friendly error message
    throw new Error("Could not load event data. Please try refreshing the page.");
  }
};

const fetchAds = async (language: 'es' | 'en'): Promise<AdItem[]> => {
  try {
    const response = await fetch(`/data/ads_${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching static ad data:", error);
    // Return an empty array on failure so the app doesn't crash
    return [];
  }
};

export const geminiService = {
  fetchEvents,
  fetchAds,
};