
import React from 'react';
import { MapIcon, ListIcon } from './IconComponents';

interface ViewToggleProps {
  view: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {

  const buttonClasses = (buttonView: 'list' | 'map') =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
      view === buttonView
        ? 'bg-cyan-600 text-white shadow-md'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`;

  return (
    <div className="bg-gray-800/50 p-1 rounded-lg border border-gray-700 flex space-x-1">
      <button onClick={() => onViewChange('list')} className={buttonClasses('list')} aria-pressed={view === 'list'}>
        <ListIcon className="w-5 h-5" />
        <span>List</span>
      </button>
      <button onClick={() => onViewChange('map')} className={buttonClasses('map')} aria-pressed={view === 'map'}>
        <MapIcon className="w-5 h-5" />
        <span>Map</span>
      </button>
    </div>
  );
};

export default ViewToggle;
