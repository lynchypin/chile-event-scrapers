import React, { useState, useEffect, useCallback } from 'react';
import { Filters, SortOrder, CategoryNode } from '../types';
import { SearchIcon, CloseIcon } from './IconComponents';
import { useLanguage } from '../contexts/LanguageContext';
import ViewToggle from './ViewToggle';

interface FilterBarProps {
  categories: CategoryNode[];
  comunas: string[];
  onFilterChange: (filters: Omit<Filters, 'sortOrder'>) => void;
  onSortChange: (sortOrder: SortOrder) => void;
  displayMode: 'list' | 'map';
  onDisplayModeChange: (view: 'list' | 'map') => void;
  maxPrice: number;
}

const colorClasses = {
  purple: ['bg-purple-600', 'bg-purple-500', 'bg-purple-400'],
  green: ['bg-green-600', 'bg-green-500', 'bg-green-400'],
  pink: ['bg-pink-600', 'bg-pink-500', 'bg-pink-400'],
  yellow: ['bg-yellow-600', 'bg-yellow-500', 'bg-yellow-400'],
  blue: ['bg-blue-600', 'bg-blue-500', 'bg-blue-400'],
  orange: ['bg-orange-600', 'bg-orange-500', 'bg-orange-400'],
};


const DatePresetButton: React.FC<{label: string, onClick: () => void}> = ({ label, onClick }) => (
    <button
      onClick={onClick}
      className="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white transition-colors"
    >
      {label}
    </button>
);

const FilterBar: React.FC<FilterBarProps> = ({ categories, comunas, onFilterChange, onSortChange, displayMode, onDisplayModeChange, maxPrice }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-asc');
  const [comuna, setComuna] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
  
  const { t } = useLanguage();
  
  const translateCategory = (name: string) => {
    const key = `cat_${name.replace(/\s/g, '').replace('/', '')}` as keyof typeof t;
    return t[key] || name;
  }

  useEffect(() => {
    // When the max price from props changes (e.g., after data loads),
    // update the upper bound of the slider.
    setPriceRange(current => [current[0], maxPrice]);
  }, [maxPrice]);


  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({ searchTerm, startDate, endDate, categories: selectedPaths, comuna, priceRange });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, startDate, endDate, selectedPaths, comuna, priceRange, onFilterChange]);

  useEffect(() => {
    onSortChange(sortOrder);
  }, [sortOrder, onSortChange]);
  
  const handleCategoryClick = (path: string, hasSubCategories: boolean) => {
    // Toggle expansion for parent categories
    if (hasSubCategories) {
      setExpandedPaths(prev =>
        prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
      );
    }

    // Toggle selection
    setSelectedPaths(prev => {
      const isSelected = prev.includes(path);
      if (isSelected) {
        // Deselecting: remove itself and all children paths
        return prev.filter(p => p !== path && !p.startsWith(path + '>'));
      } else {
        // Selecting: add the new path
        return [...prev, path];
      }
    });
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  }

  const handleSetDatePreset = (preset: 'today' | 'weekend' | 'week') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'weekend':
        const dayOfWeek = today.getDay(); // Sunday = 0, Saturday = 6
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        const nextSunday = new Date(nextFriday);
        nextSunday.setDate(nextFriday.getDate() + 2);
        setStartDate(formatDate(nextFriday));
        setEndDate(formatDate(nextSunday));
        break;
      case 'week':
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 6);
        setStartDate(formatDate(today));
        setEndDate(formatDate(nextWeek));
        break;
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedPaths([]);
    setExpandedPaths([]);
    setStartDate('');
    setEndDate('');
    setComuna('');
    setSortOrder('date-asc');
    setPriceRange([0, maxPrice]);
  };
  
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), priceRange[1]);
    setPriceRange([value, priceRange[1]]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), priceRange[0]);
    setPriceRange([priceRange[0], value]);
  };
  
  const renderCategories = useCallback((cats: CategoryNode[], level: number, parentPath: string) => {
    return cats.map(cat => {
      const currentPath = parentPath ? `${parentPath}>${cat.name}` : cat.name;
      const isSelected = selectedPaths.includes(currentPath);
      const isExpanded = expandedPaths.includes(currentPath);
      const hasSubCategories = !!cat.subCategories && cat.subCategories.length > 0;
      
      // Use the level to select a color shade. Fallback for deeper nesting.
      const bgColor = colorClasses[cat.color][level] || colorClasses[cat.color][colorClasses[cat.color].length - 1];
      const buttonClasses = `
        px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none 
        focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500
        text-white flex items-center gap-2
        ${isSelected ? `${bgColor} shadow-md opacity-100` : `bg-gray-700/50 border-2 border-gray-600 opacity-70 hover:opacity-100`}
      `;

      return (
        <div key={currentPath} className="flex flex-col items-start">
          <button onClick={() => handleCategoryClick(currentPath, hasSubCategories)} className={buttonClasses}>
            {translateCategory(cat.name)}
            {hasSubCategories && (
              <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {isExpanded && hasSubCategories && (
            <div className="pl-6 pt-2 flex flex-wrap gap-2 animate-fade-in-down">
              {renderCategories(cat.subCategories!, level + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  }, [selectedPaths, expandedPaths, handleCategoryClick, translateCategory]);

  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg sticky top-4 z-10 border border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex-grow flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h2 className="text-lg font-semibold text-white">{t.filtersTitle}</h2>
          <button
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold py-2 px-4 rounded-md transition duration-300"
            aria-expanded={isExpanded}
            aria-controls="filter-panel"
          >
            {isExpanded ? t.hideFilters : t.showFilters}
            <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="ml-4 hidden lg:block flex-shrink-0">
          <ViewToggle view={displayMode} onViewChange={onDisplayModeChange} />
        </div>
      </div>

      {isExpanded && (
        <div id="filter-panel" className="pt-4 animate-fade-in-down space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">{t.searchLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="text-gray-400" />
                </div>
                <input
                  type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>
            </div>
             <div>
              <label htmlFor="price-range-min" className="block text-sm font-medium text-gray-300 mb-2 truncate">
                {t.priceRangeLabel}: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(priceRange[0])} - {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(priceRange[1])}{priceRange[1] >= maxPrice ? '+' : ''}
              </label>
              <div className="relative h-5 flex items-center">
                  <div className="absolute w-full h-1 bg-gray-600 rounded-full"></div>
                  <div 
                      className="absolute h-1 bg-cyan-500 rounded-full"
                      style={{ left: `${(priceRange[0] / maxPrice) * 100}%`, right: `${100 - (priceRange[1] / maxPrice) * 100}%` }}
                  ></div>
                  <input
                      id="price-range-min"
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="1000"
                      value={priceRange[0]}
                      onChange={handleMinPriceChange}
                      className="range-slider"
                      aria-label="Minimum price"
                  />
                  <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="1000"
                      value={priceRange[1]}
                      onChange={handleMaxPriceChange}
                      className="range-slider"
                      aria-label="Maximum price"
                  />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.eventTypeLabel}</label>
            <div className="flex flex-wrap gap-3 items-start">
              {renderCategories(categories, 0, '')}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">{t.startDateLabel}</label>
                <div className="flex items-center gap-2">
                  <DatePresetButton label="Today" onClick={() => handleSetDatePreset('today')} />
                  <DatePresetButton label="Weekend" onClick={() => handleSetDatePreset('weekend')} />
                  <DatePresetButton label="7 Days" onClick={() => handleSetDatePreset('week')} />
                </div>
              </div>
              <input
                type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">{t.endDateLabel}</label>
              <input
                type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div>
                <label htmlFor="comuna" className="block text-sm font-medium text-gray-300 mb-1">{t.comunaLabel}</label>
                <select
                  id="comuna" value={comuna} onChange={(e) => setComuna(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none"
                >
                  <option value="">{t.allComunas}</option>
                  {comunas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div>
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-300 mb-1">{t.sortLabel}</label>
                <select
                  id="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition appearance-none"
                >
                  <option value="date-asc">{t.sortDateAsc}</option>
                  <option value="date-desc">{t.sortDateDesc}</option>
                  <option value="popularity">{t.sortPopularity}</option>
                </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-700">
            <button
                onClick={handleClearFilters}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
                <CloseIcon className="w-5 h-5" />
                <span>{t.clearFilters}</span>
            </button>
          </div>

           <div className="lg:hidden mt-4 flex justify-center">
              <ViewToggle view={displayMode} onViewChange={onDisplayModeChange} />
            </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }

        .range-slider {
          position: absolute;
          width: 100%;
          height: 5px;
          pointer-events: none;
          -webkit-appearance: none;
          background: transparent;
          z-index: 2;
        }

        .range-slider::-webkit-slider-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #06b6d4; /* cyan-500 */
          border: 2px solid #ffffff;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -8px;
          z-index: 10;
        }

        .range-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #06b6d4;
          border: 2px solid #ffffff;
          cursor: pointer;
        }

      `}</style>
    </div>
  );
};

export default FilterBar;