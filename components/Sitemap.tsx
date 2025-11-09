

import React, { useMemo } from 'react';
import { EventItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CloseIcon } from './IconComponents';

interface SitemapProps {
  events: EventItem[];
  onEventClick: (event: EventItem) => void;
  onClose: () => void;
}

const getEmojiForType = (typePath: string): string => {
  const lastPart = typePath.split('>').pop() || '';
  switch (lastPart) {
    case 'Concert': return '🎤';
    case 'Theater': return '🎭';
    case 'Comedy': return '😂';
    case 'Music Festival': return '🎉';
    case 'Cultural Festival': return '🌍';
    case 'Art Exhibit': return '🎨';
    case 'Workshop': return '🛠️';
    default: return '🎟️';
  }
};

const legendCategories = [
    "Music>Concert",
    "Performing Arts>Theater",
    "Performing Arts>Comedy",
    "Festivals>Music Festival",
    "Festivals>Cultural Festival",
    "Visual Arts>Art Exhibit",
    "Education>Workshop"
];


// Helper to parse YYYY-MM-DD string as a local date at midnight
const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  // This creates a date at midnight in the browser's local timezone
  return new Date(year, month - 1, day);
};

const Sitemap: React.FC<SitemapProps> = ({ events, onEventClick, onClose }) => {
  const { t, language } = useLanguage();

  const groupedEvents = useMemo(() => {
    // Get today's date as a 'YYYY-MM-DD' string in the local timezone to avoid UTC conversion issues.
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    const upcoming = events
      .filter(event => (event.endDate || event.startDate) >= todayString)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const groups = upcoming.reduce((acc, event) => {
      const eventDate = parseLocalDate(event.startDate);
      const monthYear = eventDate.toLocaleDateString(language === 'es' ? 'es-CL' : 'en-US', {
        year: 'numeric',
        month: 'long',
      });
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(event);
      return acc;
    }, {} as Record<string, EventItem[]>);

    return Object.entries(groups);
  }, [events, language]);
  
  const getDisplayCategory = (typePath: string) => {
      const parts = typePath.split('>');
      const lastPart = parts[parts.length - 1];
      const key = `cat_${lastPart.replace(/\s/g, '')}` as keyof typeof t;
      return t[key] || lastPart;
  }
  
  const legendItems = legendCategories.map(path => ({
    emoji: getEmojiForType(path),
    label: getDisplayCategory(path),
  }));

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 p-4 sm:p-8 overflow-y-auto animate-fade-in">
      <div className="container mx-auto max-w-4xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            {t.sitemapTitle}
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label={t.backToEvents}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">{t.sitemapLegend}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {legendItems.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-gray-300">
                <span className="text-xl" aria-hidden="true">{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {groupedEvents.length > 0 ? groupedEvents.map(([monthYear, eventsInMonth]) => (
            <section key={monthYear} aria-labelledby={`month-${monthYear.replace(' ', '-')}`}>
              <h2 id={`month-${monthYear.replace(' ', '-')}`} className="text-2xl font-semibold text-cyan-400 mb-4 pb-2 border-b-2 border-gray-700">
                {monthYear}
              </h2>
              <ul className="space-y-2">
                {eventsInMonth.map(event => {
                  const eventDate = parseLocalDate(event.startDate);
                  return (
                    <li key={event.id}>
                      <button
                        onClick={() => onEventClick(event)}
                        className="w-full text-left flex items-center gap-4 p-3 rounded-md hover:bg-gray-800/70 transition-colors duration-200"
                      >
                        <div className="flex flex-col items-center justify-center bg-gray-700 w-16 h-16 rounded-lg flex-shrink-0">
                          <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">
                            {eventDate.toLocaleDateString(language, { month: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-white">
                            {eventDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <p className="text-lg text-gray-100 font-semibold">{event.title}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <span className="text-lg" aria-hidden="true">{getEmojiForType(event.type)}</span>
                            <span>{getDisplayCategory(event.type)}</span>
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )) : (
              <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg">
                <p className="text-xl">{t.noEventsTitle}</p>
              </div>
           )}
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Sitemap;