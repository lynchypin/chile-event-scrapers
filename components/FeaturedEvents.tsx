

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EventItem, isAdItem, DisplayItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { TagIcon } from './IconComponents';

interface FeaturedEventsProps {
  items: DisplayItem[];
  onEventClick: (event: EventItem) => void;
}

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);


const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ items, onEventClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLanguage();
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = window.setTimeout(
      () => setActiveIndex((prevIndex) => (prevIndex + 1) % items.length),
      5000 // Change slide every 5 seconds
    );

    return () => {
      resetTimeout();
    };
  }, [activeIndex, items.length, resetTimeout]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  const handlePrevClick = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };
  
  const handleNextClick = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  const handleItemClick = (item: DisplayItem) => {
    if (isAdItem(item)) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
        onEventClick(item);
    }
  };

  const getTagColor = (type?: string) => {
    if (!type) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    switch (type) {
      case 'Concert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Theater': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'Festival': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Art Exhibit': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Workshop': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div 
        className="relative w-full h-[50vh] max-h-[450px] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-gray-800"
        onMouseEnter={() => resetTimeout()}
        onMouseLeave={() => {
            timeoutRef.current = window.setTimeout(
                () => setActiveIndex((prevIndex) => (prevIndex + 1) % items.length),
                5000
            );
        }}
    >
      <div 
        className="whitespace-nowrap h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item) => {
            const isAd = isAdItem(item);
            const itemType = isAd ? t.sponsored : (item as EventItem).type;
            const tagColor = getTagColor(isAd ? undefined : (item as EventItem).type);
            const buttonText = isAd ? t.learnMore : t.viewDetails;
            
            return (
                <div key={item.id} className="inline-block w-full h-full whitespace-normal align-top">
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
                        <div className="p-8 md:p-12 flex flex-col justify-center items-start text-left">
                            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tagColor} flex items-center gap-1 mb-4`}>
                                <TagIcon className="w-3 h-3"/>
                                <span>{itemType}</span>
                            </div>
                            <h2
                              className="text-3xl lg:text-4xl font-extrabold text-white mb-3 line-clamp-3 cursor-pointer hover:text-cyan-300 transition-colors"
                              onClick={() => handleItemClick(item)}
                            >
                              {item.title}
                            </h2>
                            <p className="text-gray-300 mb-6 line-clamp-2">{item.description}</p>
                            <button 
                                onClick={() => handleItemClick(item)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-6 rounded-md transition duration-300 shadow-lg hover:shadow-cyan-500/40"
                            >
                                {buttonText}
                            </button>
                        </div>
                        <div
                          className="relative h-full w-full hidden md:block cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        >
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-transparent"></div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
      
      {/* Navigation Arrows */}
       <button 
            onClick={handlePrevClick} 
            className="absolute z-10 top-1/2 -translate-y-1/2 left-4 bg-black/40 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/60 transition-colors"
            aria-label="Previous event"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <button 
            onClick={handleNextClick} 
            className="absolute z-10 top-1/2 -translate-y-1/2 right-4 bg-black/40 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/60 transition-colors"
            aria-label="Next event"
        >
            <ChevronRightIcon className="w-6 h-6" />
        </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              activeIndex === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedEvents;