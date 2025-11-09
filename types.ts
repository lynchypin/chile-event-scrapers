export type SortOrder = 'date-asc' | 'date-desc' | 'popularity';

export interface EventItem {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  startDate: string;
  endDate?: string;
  type: string; // e.g., "Music>Concert"
  location: string;
  comuna: string;
  imageUrl: string;
  isPopular: boolean;
  latitude: number;
  longitude: number;
  homepageUrl?: string;
  price?: number;
}

export interface Filters {
    searchTerm: string;
    startDate: string;
    endDate: string;
    categories: string[];
    comuna: string;
    priceRange: [number, number];
}

export interface CategoryNode {
  name: string;
  // Fix: Add 'orange' to the color union type to support the 'Family/Kids' category color used in data/categories.ts.
  color: 'purple' | 'green' | 'pink' | 'yellow' | 'blue' | 'orange';
  subCategories?: CategoryNode[];
}

// New Ad type
export interface AdItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sponsor: string;
  url: string;
}

// Union type for the display list
export type DisplayItem = EventItem | AdItem;

// Type guard to differentiate between EventItem and AdItem
export function isAdItem(item: DisplayItem): item is AdItem {
  return 'sponsor' in item;
}