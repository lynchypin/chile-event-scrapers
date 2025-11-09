import React, { useEffect, useRef, useState } from 'react';
import { EventItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Spinner from './Spinner';

declare const L: any; // Use Leaflet global object

const categoryStyles = {
    'Music': { color: '#a855f7' }, // purple-500
    'Festivals': { color: '#22c55e' }, // green-500
    'Performing Arts': { color: '#ec4899' }, // pink-500
    'Visual Arts': { color: '#eab308' }, // yellow-500
    'Education': { color: '#3b82f6' }, // blue-500
    'Family/Kids': { color: '#f97316' }, // orange-500
    'default': { color: '#6b7280' }, // gray-500
};

// Helper to create custom marker icons
const createMarkerIcon = (color: string) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="#fff" stroke-width="1">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
    </svg>
  `;
  const iconUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
  
  return L.icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapViewProps {
  events: EventItem[];
  onEventClick: (event: EventItem) => void;
}

const MapView: React.FC<MapViewProps> = ({ events, onEventClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Initialize map only once
    if (typeof L === 'undefined' || !mapContainerRef.current || mapRef.current) return;

    const newMap = L.map(mapContainerRef.current, { zoomControl: false }).setView([-33.45, -70.65], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(newMap);
    
    L.control.zoom({ position: 'bottomright' }).addTo(newMap);

    mapRef.current = newMap;
    setIsMapInitialized(true);
    
    return () => {
      newMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapInitialized) return;

    // Clear previous markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    if (events.length === 0) {
      // If there are no events, reset the view to the default for Santiago.
      map.setView([-33.45, -70.65], 12);
      return;
    }

    const newMarkers = events.map(event => {
      const rootCategory = event.type.split('>')[0] as keyof typeof categoryStyles;
      const { color } = categoryStyles[rootCategory] || categoryStyles['default'];
      const icon = createMarkerIcon(color);

      const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(map);
      
      const popupContent = `
        <div style="text-align: center;">
          <strong>${event.title}</strong>
          <br>
          <button class="custom-popup-button" data-event-id="${event.id}">
            ${t.viewDetails}
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      return marker;
    });

    markersRef.current = newMarkers;
    
    // Auto-zoom to fit all markers
    const group = L.featureGroup(newMarkers);
    const bounds = group.getBounds();
    
    if (bounds.isValid()) {
      // Using requestAnimationFrame to ensure the map container has been painted
      // and is ready for a bounds update, preventing potential race conditions.
      requestAnimationFrame(() => {
        if (mapRef.current) { // The map might have been unmounted in the meantime
          // Force the map to re-evaluate its size before fitting bounds.
          // This is crucial when the map container is shown/resized dynamically.
          mapRef.current.invalidateSize();
          // Fit bounds with padding and a max zoom level to prevent excessive zooming on single points.
          mapRef.current.fitBounds(bounds.pad(0.2), { maxZoom: 16 });
        }
      });
    }
    
  }, [events, t, isMapInitialized]);
  
  // Add an effect to handle popup button clicks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onPopupOpen = (e: any) => {
        const popup = e.popup;
        const button = popup.getElement().querySelector('.custom-popup-button');
        if (button) {
            button.addEventListener('click', () => {
                const eventId = parseInt(button.getAttribute('data-event-id')!, 10);
                const event = events.find(ev => ev.id === eventId);
                if (event) {
                    onEventClick(event);
                }
            });
        }
    };

    map.on('popupopen', onPopupOpen);

    return () => {
        map.off('popupopen', onPopupOpen);
    };
  }, [events, onEventClick]);


  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 h-[60vh] md:h-[70vh] relative z-0">
      {isMapInitialized && (
        <div className="absolute top-2 left-2 bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] border border-gray-700">
            <h4 className="text-sm font-bold text-white mb-2">{t.sitemapLegend}</h4>
            <div className="space-y-1">
                {Object.entries(categoryStyles).filter(([key]) => key !== 'default').map(([categoryName, style]) => {
                  const key = `cat_${categoryName.replace(/\s/g, '').replace('/', '')}` as keyof typeof t;
                  const label = t[key] || categoryName;
                  return (
                      <div key={categoryName} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: style.color }}></span>
                        <span className="text-xs text-gray-200">{label}</span>
                      </div>
                  );
                })}
            </div>
        </div>
      )}
      {!isMapInitialized && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <Spinner />
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;