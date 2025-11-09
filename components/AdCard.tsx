import React from 'react';
import { AdItem } from '../types';
import { LocationIcon, TagIcon } from './IconComponents';
import { useLanguage } from '../contexts/LanguageContext';

interface AdCardProps {
  ad: AdItem;
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const { t } = useLanguage();

  return (
    <a 
      href={ad.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-yellow-500/20 hover:-translate-y-1 flex flex-col group"
      aria-label={`Advertisement for ${ad.title}`}
    >
      <div className="relative">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-200">
              {ad.title}
            </h3>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 flex items-center gap-1 flex-shrink-0">
                <TagIcon className="w-3 h-3"/>
                <span>{t.sponsored}</span>
            </div>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 flex-grow">{ad.description}</p>
        
        <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center text-sm text-gray-300">
          <div className="flex items-center">
            <LocationIcon className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="truncate">{ad.sponsor}</span>
          </div>
          <div className="text-yellow-400 font-semibold text-xs uppercase">
            {t.learnMore}
          </div>
        </div>
      </div>
    </a>
  );
};

export default AdCard;
