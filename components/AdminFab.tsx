
import React from 'react';
import { AdminIcon } from './IconComponents';

interface AdminFabProps {
  onOpen: () => void;
}

const AdminFab: React.FC<AdminFabProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-4 left-4 bg-gray-700 text-gray-200 p-3 rounded-full shadow-lg hover:bg-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110 z-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
      aria-label="Open Admin Console"
      title="Admin Console"
    >
      <AdminIcon className="w-6 h-6" />
    </button>
  );
};

export default AdminFab;
