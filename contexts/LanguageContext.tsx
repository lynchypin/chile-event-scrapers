import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'es' | 'en';

const translations = {
  es: {
    title: 'Eventos en',
    city: 'Santiago',
    subtitle: 'Descubre qué hacer en la ciudad.',
    filtersTitle: 'Filtros',
    showFilters: 'Mostrar Filtros',
    hideFilters: 'Ocultar Filtros',
    searchLabel: 'Buscar evento',
    searchPlaceholder: 'Nombre o descripción...',
    eventTypeLabel: 'Categorías',
    comunaLabel: 'Comuna',
    allComunas: 'Todas las Comunas',
    allTypes: 'Todos los Tipos',
    startDateLabel: 'Fecha Inicio',
    endDateLabel: 'End Date',
    priceRangeLabel: 'Rango de Precios',
    sortLabel: 'Ordenar por',
    sortDateAsc: 'Fecha (Antiguos)',
    sortDateDesc: 'Fecha (Nuevos)',
    sortPopularity: 'Popularidad',
    clearFilters: 'Limpiar Filtros',
    oops: 'Oops! Hubo un problema.',
    tryAgain: 'Intentar de nuevo',
    noEventsTitle: 'No se encontraron eventos',
    noEventsSubtitle: 'Prueba cambiando los filtros o seleccionando otra categoría.',
    footer: 'Creado con React, Tailwind CSS y la API de Gemini.',
    viewDetailsFor: 'Ver detalles para',
    viewDetails: 'Ver Detalles',
    closeModal: 'Cerrar modal',
    share: 'Compartir',
    linkCopied: '¡Enlace copiado!',
    popular: 'Popular',
    addToCalendar: 'Añadir al Calendario',
    locationMap: 'Mapa de Ubicación',
    addToCalendarConfirm: 'Esto abrirá Google Calendar en una nueva pestaña para agregar el evento. ¿Deseas continuar?',
    sitemapTitle: 'Mapa del Sitio de Eventos',
    sitemapLegend: 'Leyenda de Tipos',
    sitemapLink: 'Mapa del Sitio',
    backToEvents: 'Volver a Eventos',
    sponsored: 'Patrocinado',
    learnMore: 'Saber Más',
    featuredEventsTitle: 'Eventos Destacados',
    subscribe: 'Suscribirse',
    officialWebsite: 'Sitio Web Oficial',
    visitWebsite: 'Visitar Sitio Web',
    // New category translations
    cat_Music: 'Música',
    cat_Concert: 'Conciertos',
    cat_Festivals: 'Festivales',
    cat_MusicFestival: 'Festival de Música',
    cat_CulturalFestival: 'Festival Cultural',
    cat_PerformingArts: 'Artes Escénicas',
    cat_Theater: 'Teatro',
    cat_Comedy: 'Comedia',
    cat_VisualArts: 'Artes Visuales',
    cat_ArtExhibit: 'Exhibición de Arte',
    cat_Education: 'Educación',
    cat_Workshop: 'Talleres',
    cat_Rock: 'Rock',
    cat_Pop: 'Pop',
    cat_Indie: 'Indie',
    cat_Electronic: 'Electrónica',
    cat_FamilyKids: 'Familia/Niños',
    cat_ChildrensTheater: 'Teatro Infantil',
    cat_Outdoor: 'Aire Libre',
  },
  en: {
    title: 'Events in',
    city: 'Santiago',
    subtitle: 'Discover what to do in the city.',
    filtersTitle: 'Filters',
    showFilters: 'Show Filters',
    hideFilters: 'Hide Filters',
    searchLabel: 'Search event',
    searchPlaceholder: 'Name or description...',
    eventTypeLabel: 'Categories',
    comunaLabel: 'District',
    allComunas: 'All Districts',
    allTypes: 'All Types',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    priceRangeLabel: 'Price Range',
    sortLabel: 'Sort by',
    sortDateAsc: 'Date (Oldest)',
    sortDateDesc: 'Date (Newest)',
    sortPopularity: 'Popularity',
    clearFilters: 'Clear Filters',
    oops: 'Oops! There was a problem.',
    tryAgain: 'Try again',
    noEventsTitle: 'No events found',
    noEventsSubtitle: 'Try changing the filters or selecting another category.',
    footer: 'Created with React, Tailwind CSS, and the Gemini API.',
    viewDetailsFor: 'View details for',
    viewDetails: 'View Details',
    closeModal: 'Close modal',
    share: 'Share',
    linkCopied: 'Link copied!',
    popular: 'Popular',
    addToCalendar: 'Add to Calendar',
    locationMap: 'Location Map',
    addToCalendarConfirm: 'This will open Google Calendar in a new tab to add the event. Do you wish to continue?',
    sitemapTitle: 'Event Sitemap',
    sitemapLegend: 'Type Legend',
    sitemapLink: 'Sitemap',
    backToEvents: 'Back to Events',
    sponsored: 'Sponsored',
    learnMore: 'Learn More',
    featuredEventsTitle: 'Featured Events',
    subscribe: 'Subscribe',
    officialWebsite: 'Official Website',
    visitWebsite: 'Visit Website',
    // New category translations
    cat_Music: 'Music',
    cat_Concert: 'Concert',
    cat_Festivals: 'Festivals',
    cat_MusicFestival: 'Music Festival',
    cat_CulturalFestival: 'Cultural Festival',
    cat_PerformingArts: 'Performing Arts',
    cat_Theater: 'Theater',
    cat_Comedy: 'Comedy',
    cat_VisualArts: 'Visual Arts',
    cat_ArtExhibit: 'Art Exhibit',
    cat_Education: 'Education',
    cat_Workshop: 'Workshop',
    cat_Rock: 'Rock',
    cat_Pop: 'Pop',
    cat_Indie: 'Indie',
    cat_Electronic: 'Electronic',
    cat_FamilyKids: 'Family/Kids',
    cat_ChildrensTheater: 'Children\'s Theater',
    cat_Outdoor: 'Outdoor',
  }
};

type Translations = typeof translations.es;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};