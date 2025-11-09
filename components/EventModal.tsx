import React, { useEffect, useRef } from 'react';
import { EventItem } from '../types';
import { CalendarIcon, CloseIcon, LocationIcon, TagIcon, AddToCalendarIcon, ExternalLinkIcon } from './IconComponents';
import { useLanguage } from '../contexts/LanguageContext';

declare const L: any;

interface EventModalProps {
  event: EventItem;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const { language, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
     if (typeof L === 'undefined' || !mapContainerRef.current || mapRef.current) return;

    const position: [number, number] = [event.latitude, event.longitude];

    const newMap = L.map(mapContainerRef.current).setView(position, 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(newMap);
    
    L.marker(position).addTo(newMap);
    
    mapRef.current = newMap;
    
    // In modals, sometimes the map initializes before the container is properly sized.
    // This timeout ensures the map resizes correctly after the modal animation.
    const resizeTimer = setTimeout(() => newMap.invalidateSize(), 400);

    return () => {
      clearTimeout(resizeTimer);
      newMap.remove();
      mapRef.current = null;
    };
  }, [event]);


  const formatEventDate = (startDateStr: string, endDateStr?: string) => {
    const start = new Date(startDateStr.replace(/-/g, '/'));
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const locale = language === 'es' ? 'es-CL' : 'en-US';

    if (endDateStr && endDateStr !== startDateStr) {
      const end = new Date(endDateStr.replace(/-/g, '/'));
      return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
    }
    
    return start.toLocaleDateString(locale, options);
  };

  const formattedDate = formatEventDate(event.startDate, event.endDate);

  const getCategoryStyle = (typePath: string) => {
    const rootCategory = typePath.split('>')[0];
    switch (rootCategory) {
      case 'Music': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Performing Arts': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'Festivals': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Visual Arts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Education': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Family/Kids': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  
  const getDisplayCategory = (typePath: string) => {
      const parts = typePath.split('>');
      const lastPart = parts[parts.length - 1];
      const key = `cat_${lastPart.replace(/\s/g, '').replace('/', '')}` as keyof typeof t;
      return t[key] || lastPart;
  }
  
  const createCalendarLink = (event: EventItem) => {
    const startDate = new Date(event.startDate.replace(/-/g, '/'));
    const endDate = event.endDate ? new Date(event.endDate.replace(/-/g, '/')) : startDate;
    
    const formatDateForGoogle = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const startDateStr = formatDateForGoogle(startDate);

    // Google Calendar's end date is exclusive for all-day events, so add one day to the actual end date.
    const nextDay = new Date(endDate);
    nextDay.setDate(endDate.getDate() + 1);
    const endDateStr = formatDateForGoogle(nextDay);

    const googleCalendarUrl = new URL('https://www.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', event.title);
    googleCalendarUrl.searchParams.append('dates', `${startDateStr}/${endDateStr}`);
    googleCalendarUrl.searchParams.append('details', event.longDescription);
    googleCalendarUrl.searchParams.append('location', `${event.location}, ${event.comuna}`);

    return googleCalendarUrl.toString();
  };


  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-gray-900/50 p-2 rounded-full text-white hover:bg-gray-900/80 transition-colors"
            aria-label={t.closeModal}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 id="event-title" className="text-2xl md:text-3xl font-bold text-white">{event.title}</h2>
             <div className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${getCategoryStyle(event.type)} flex items-center gap-2 flex-shrink-0`}>
                <TagIcon className="w-4 h-4"/>
                <span>{getDisplayCategory(event.type)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 text-gray-300 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-cyan-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <LocationIcon className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="truncate">{event.location}, {event.comuna}</span>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.longDescription}</p>

          <div className="mt-8">
             <a
                href={createCalendarLink(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
            >
                <AddToCalendarIcon className="w-5 h-5" />
                <span>{t.addToCalendar}</span>
            </a>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-3">{t.locationMap}</h3>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-700 relative bg-gray-900">
               <div
                  ref={mapContainerRef}
                  className="w-full h-full"
               />
            </div>
          </div>

          {event.homepageUrl && (
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-3">{t.officialWebsite}</h3>
                <a
                    href={event.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-2 px-4 rounded-md transition duration-300"
                >
                    <ExternalLinkIcon className="w-5 h-5" />
                    <span>{t.visitWebsite}</span>
                </a>
            </div>
          )}

        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EventModal;