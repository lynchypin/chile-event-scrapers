import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const buttonClasses = (lang: 'es' | 'en') =>
    `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
      language === lang
        ? 'bg-cyan-500 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg border border-gray-700 flex space-x-1">
      <button onClick={() => setLanguage('es')} className={buttonClasses('es')}>
        ES
      </button>
      <button onClick={() => setLanguage('en')} className={buttonClasses('en')}>
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;