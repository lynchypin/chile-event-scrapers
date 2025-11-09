

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { EventItem, Filters, SortOrder, AdItem, DisplayItem, isAdItem, CategoryNode } from './types';
import { initialCategories } from './data/categories';
import EventCard from './components/EventCard';
import AdCard from './components/AdCard';
import FilterBar from './components/FilterBar';
import Spinner from './components/Spinner';
import EventModal from './components/EventModal';
import Toast from './components/Toast';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import Sitemap from './components/Sitemap';
import MapView from './components/MapView';
import FeaturedEvents from './components/FeaturedEvents';
import AdminFab from './components/AdminFab';
import AdminConsole from './components/AdminConsole';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
};

// Helper to parse YYYY-MM-DD string as a local date at midnight, avoiding timezone issues.
// An empty string from a date filter will result in null.
const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  // Using new Date(year, monthIndex, day) is robust against timezone shifts.
  return new Date(year, month - 1, day);
};

const MainContent: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Omit<Filters, 'sortOrder'>>({ searchTerm: '', startDate: '', endDate: '', categories: [], comuna: '', priceRange: [0, 100000] });
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-asc');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [page, setPage] = useState<'home' | 'sitemap'>('home');
  const [displayMode, setDisplayMode] = useState<'list' | 'map'>('list');
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>(initialCategories);
  const { language, t } = useLanguage();
  const filterBarContainerRef = useRef<HTMLDivElement>(null);
  
  // State for infinite scroll
  const ITEMS_PER_PAGE = 9;
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);


  const fetchAndSetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [events, fetchedAds] = await Promise.all([
        geminiService.fetchEvents(language),
        geminiService.fetchAds(language),
      ]);
      
      setAllEvents(events);
      setAds(fetchedAds);

      // Check for deep-linked event after fetching
      const urlParams = new URLSearchParams(window.location.search);
      const eventIdStr = urlParams.get('event');
      if (eventIdStr) {
        const eventId = parseInt(eventIdStr, 10);
        if (!isNaN(eventId)) {
          const eventToOpen = events.find(e => e.id === eventId);
          if (eventToOpen) {
            setSelectedEvent(eventToOpen);
            // Clean up URL to prevent modal from re-opening on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  const handleFilterChange = useCallback((newFilters: Omit<Filters, 'sortOrder'>) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
  }, []);
  
  const handleEventClick = useCallback((event: EventItem) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  
  const handleShowToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const handleSitemapEventClick = useCallback((event: EventItem) => {
    setSelectedEvent(event);
    setPage('home');
  }, []);
  
  const comunas = useMemo(() => {
    if (!allEvents) return [];
    const uniqueComunas = new Set(allEvents.map(event => event.comuna).filter(Boolean));
    return Array.from(uniqueComunas).sort();
  }, [allEvents]);

  const maxPrice = useMemo(() => {
    if (allEvents.length === 0) return 100000; // Default max if no events yet
    const prices = allEvents.map(e => e.price ?? 0);
    return Math.max(...prices, 50000); // Ensure a reasonable minimum max
  }, [allEvents]);

  const heroItems = useMemo((): DisplayItem[] => {
    const popularEvents = allEvents
        .filter(event => event.isPopular)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Oldest popular first for variety
        .slice(0, 5); // Take top 5 popular events

    const heroAd = ads.length > 0 ? [ads[0]] : []; // Take the first ad

    // Shuffle for variety on each load
    const combined = [...popularEvents, ...heroAd];
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.slice(0, 6); // Ensure max 6 items
  }, [allEvents, ads]);


  const displayedEvents = useMemo(() => {
    const filtered = allEvents.filter(event => {
      const categoryMatch = filters.categories.length === 0 ||
        filters.categories.some(catPath => event.type.startsWith(catPath));
      
      const searchTermMatch = !filters.searchTerm ||
        event.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
      const comunaMatch = !filters.comuna || event.comuna === filters.comuna;

      const priceMatch = (() => {
        const eventPrice = event.price ?? 0; // Treat undefined or null price as free
        const [minPrice, maxPrice] = filters.priceRange;
        return eventPrice >= minPrice && eventPrice <= maxPrice;
      })();

      const dateMatch = (() => {
        const eventStart = parseLocalDate(event.startDate);
        if (!eventStart) return false;
        // If no endDate, it's a single-day event. Use startDate as endDate.
        const eventEnd = event.endDate ? parseLocalDate(event.endDate) : eventStart;
        if (!eventEnd) return false;

        const filterStart = parseLocalDate(filters.startDate);
        const filterEnd = parseLocalDate(filters.endDate);

        // If there are no date filters, the event is a match.
        if (!filterStart && !filterEnd) return true;

        // Case 1: Filter has start and end date. Check for range overlap.
        // Overlap exists if event starts before filter ends AND event ends after filter starts.
        if (filterStart && filterEnd) {
            return eventStart <= filterEnd && eventEnd >= filterStart;
        }
        // Case 2: Filter only has start date. Event must end on or after this date.
        if (filterStart) {
            return eventEnd >= filterStart;
        }
        // Case 3: Filter only has end date. Event must start on or before this date.
        if (filterEnd) {
            return eventStart <= filterEnd;
        }
        
        return false; // Should not be reached if logic is correct
      })();
      
      return categoryMatch && searchTermMatch && dateMatch && comunaMatch && priceMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'popularity') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
      }

      const dateA = parseLocalDate(a.startDate)?.getTime() ?? 0;
      const dateB = parseLocalDate(b.startDate)?.getTime() ?? 0;

      if (sortOrder === 'date-desc') {
        return dateB - dateA;
      }
      // 'date-asc' or secondary sort for 'popularity'
      return dateA - dateB;
    });

    return sorted;
  }, [allEvents, filters, sortOrder]);

  const fullDisplayedItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [...displayedEvents];
    
    // Intersperse ads into the event list, ensuring they are not the same as the hero ad
    const gridAds = ads.length > 1 ? ads.slice(1) : [];

    if (gridAds.length > 0 && items.length > 0) {
      let adIndex = 0;
      // Start inserting after the 3rd item, then every 6 items after that
      for (let i = 3; i < items.length; i += 6) {
        if (adIndex < gridAds.length) {
          items.splice(i, 0, gridAds[adIndex]);
          adIndex++;
        } else {
          break; // No more ads to insert
        }
      }
    }
    
    return items;
  }, [displayedEvents, ads]);

  // Sliced items for display
  const displayedItems = useMemo(() => {
    return fullDisplayedItems.slice(0, visibleItemsCount);
  }, [fullDisplayedItems, visibleItemsCount]);

  // Infinite scroll logic
  const loadMoreItems = useCallback(() => {
    if (visibleItemsCount >= fullDisplayedItems.length) return;
    
    setIsLoadingMore(true);
    // Using a timeout to give a better visual feedback and prevent stuttering
    setTimeout(() => {
        setVisibleItemsCount(prevCount => prevCount + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
    }, 500);
  }, [visibleItemsCount, fullDisplayedItems.length]);

  useEffect(() => {
    const handleScroll = () => {
      // Do not trigger if already loading, or if map view is active
      if (isLoadingMore || displayMode === 'map') return;

      // Check if all items are already displayed
      if (visibleItemsCount >= fullDisplayedItems.length) return;

      // Trigger load more when user is 500px from the bottom.
      // Using scrollHeight is more reliable than offsetHeight for the total document height.
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - 500) {
          loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, visibleItemsCount, fullDisplayedItems.length, loadMoreItems, displayMode]);

  // Reset item count and scroll to filters when filters change
  useEffect(() => {
    setVisibleItemsCount(ITEMS_PER_PAGE);
    // Instead of jumping to the top, smoothly scroll to the filter bar.
    // This keeps the user's context and avoids a jarring jump, while still
    // positioning them to see the new results.
    if (filterBarContainerRef.current) {
        const elementTop = filterBarContainerRef.current.getBoundingClientRect().top + window.scrollY;
        const y = elementTop - 20; // 20px buffer from the top of the viewport
        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
    }
  }, [filters, sortOrder]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8 relative">
        <div className="flex justify-end mb-4 md:absolute md:top-4 md:right-4 md:mb-0 items-center gap-2 z-20">
          <a
            href="#"
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
            aria-label={t.subscribe}
          >
            {t.subscribe}
          </a>
          <LanguageToggle />
        </div>
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            <span className="text-white">{t.title} </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">{t.city}</span>
          </h1>
          <p className="text-lg text-gray-400 mt-2">{t.subtitle}</p>
        </header>

        <hr className="border-t border-gray-700/50 mb-12" />

        {!isLoading && heroItems.length > 0 && (
          <section className="mb-12">
            <FeaturedEvents items={heroItems} onEventClick={handleEventClick} />
          </section>
        )}

        <div className="mb-8" ref={filterBarContainerRef}>
            <FilterBar 
              categories={categories}
              comunas={comunas}
              onFilterChange={handleFilterChange} 
              onSortChange={handleSortChange}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              maxPrice={maxPrice}
            />
        </div>
        
        {isLoading && <Spinner />}

        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                <p className="font-bold">{t.oops}</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchAndSetData}
                  className="mt-4 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
                >
                  {t.tryAgain}
                </button>
            </div>
        )}

        {!isLoading && !error && (
          <>
            {fullDisplayedItems.length > 0 ? (
               <>
                {displayMode === 'list' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedItems.map(item => (
                         isAdItem(item)
                          ? <AdCard key={item.id} ad={item} />
                          : <EventCard key={item.id} event={item} onClickTitle={handleEventClick} onShare={handleShowToast} />
                      ))}
                    </div>
                    {isLoadingMore && (
                        <div className="mt-8">
                            <Spinner />
                        </div>
                    )}
                  </>
                )}
                {displayMode === 'map' && (
                    <MapView events={displayedEvents} onEventClick={handleEventClick} />
                )}
              </>
            ) : (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
                    <h3 className="text-2xl font-semibold text-white">{t.noEventsTitle}</h3>
                    <p className="text-gray-400 mt-2">{t.noEventsSubtitle}</p>
                </div>
            )}
          </>
        )}
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>{t.footer}</p>
        <button 
          onClick={() => setPage('sitemap')}
          className="mt-2 text-cyan-400 hover:underline"
          aria-label="Open sitemap"
        >
          {t.sitemapLink}
        </button>
      </footer>
      
      {page === 'sitemap' && (
        <Sitemap 
          events={allEvents} 
          onEventClick={handleSitemapEventClick} 
          onClose={() => setPage('home')} 
        />
      )}
      
      {selectedEvent && <EventModal event={selectedEvent} onClose={handleCloseModal} />}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      <AdminFab onOpen={() => setIsAdminConsoleOpen(true)} />
      {isAdminConsoleOpen && (
        <AdminConsole
          events={allEvents}
          ads={ads}
          categories={categories}
          onUpdateEvents={setAllEvents}
          onUpdateAds={setAds}
          onUpdateCategories={setCategories}
          onClose={() => setIsAdminConsoleOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
