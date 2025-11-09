import React, { useState } from 'react';
import { EventItem } from '../types';
import { CalendarIcon, LocationIcon, TagIcon, ShareIcon, FireIcon, AddToCalendarIcon } from './IconComponents';
import { useLanguage } from '../contexts/LanguageContext';

interface EventCardProps {
  event: EventItem;
  onClickTitle: (event: EventItem) => void;
  onShare: (message: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClickTitle, onShare }) => {
  const { language, t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);

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
    googleCalendarUrl.searchParams.append('details', event.description);
    googleCalendarUrl.searchParams.append('location', `${event.location}, ${event.comuna}`);

    return googleCalendarUrl.toString();
  };

  const handleShare = async () => {
    if (isSharing) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${event.id}`;
    setIsSharing(true);

    try {
      await navigator.clipboard.writeText(shareUrl);
      onShare(t.linkCopied);
    } catch (error) {
      console.error('Could not copy link to clipboard:', error);
      // Optionally, show an error toast
    } finally {
      // Prevent spamming the toast message
      setTimeout(() => setIsSharing(false), 1500);
    }
  };

  const handleAddToCalendar = () => {
    // Removed the confirmation dialog for a more direct action.
    window.open(createCalendarLink(event), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-cyan-500/20 hover:-translate-y-1 flex flex-col">
      <div className="relative">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onClickTitle(event)}
        />
        {event.isPopular && (
            <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm border border-red-500/50 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <FireIcon className="w-4 h-4" />
                <span>{t.popular}</span>
            </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <h3 
              className="text-xl font-bold text-white mb-2 cursor-pointer hover:text-cyan-400 transition-colors duration-200"
              onClick={() => onClickTitle(event)}
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') onClickTitle(event) }}
              role="button"
              aria-label={`${t.viewDetailsFor} ${event.title}`}
            >
              {event.title}
            </h3>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryStyle(event.type)} flex items-center gap-1 flex-shrink-0`}>
                <TagIcon className="w-3 h-3"/>
                <span>{getDisplayCategory(event.type)}</span>
            </div>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 flex-grow">{event.description}</p>
        
        <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center text-sm text-gray-300">
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <CalendarIcon className="w-4 h-4 mr-2 text-cyan-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <LocationIcon className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="truncate">{event.location}, {event.comuna}</span>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleAddToCalendar}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
              aria-label={`${t.addToCalendar} for ${event.title}`}
              title={t.addToCalendar}
            >
              <AddToCalendarIcon className="w-5 h-5 text-cyan-400" />
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 ${isSharing ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label={`${t.share} ${event.title}`}
              title={t.share}
            >
              <ShareIcon className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;