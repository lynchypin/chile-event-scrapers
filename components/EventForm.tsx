import React, { useState } from 'react';
import { EventItem } from '../types';

interface EventFormProps {
  event: EventItem | null;
  onSave: (event: EventItem) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<EventItem, 'id'>>({
    title: event?.title || '',
    description: event?.description || '',
    longDescription: event?.longDescription || '',
    startDate: event?.startDate || '',
    endDate: event?.endDate || '',
    type: event?.type || 'Music>Concert',
    location: event?.location || '',
    comuna: event?.comuna || '',
    imageUrl: event?.imageUrl || '',
    isPopular: event?.isPopular || false,
    latitude: event?.latitude || 0,
    longitude: event?.longitude || 0,
    homepageUrl: event?.homepageUrl || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: event?.id || Date.now(), // Keep existing id or generate new one
    });
  };
  
  const inputClass = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
            {event ? 'Edit Event' : 'Create New Event'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="title" className={labelClass}>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
                <label htmlFor="type" className={labelClass}>Event Category (e.g. Music>Concert)</label>
                <input type="text" name="type" value={formData.type} onChange={handleChange} className={inputClass} required />
            </div>
        </div>

        <div>
            <label htmlFor="description" className={labelClass}>Short Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={2}></textarea>
        </div>
         <div>
            <label htmlFor="longDescription" className={labelClass}>Long Description</label>
            <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} className={inputClass} rows={4}></textarea>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label htmlFor="startDate" className={labelClass}>Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={`${inputClass} appearance-none`} style={{ colorScheme: 'dark' }} required />
            </div>
            <div>
                <label htmlFor="endDate" className={labelClass}>End Date (optional)</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={`${inputClass} appearance-none`} style={{ colorScheme: 'dark' }} />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="location" className={labelClass}>Location Name</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="comuna" className={labelClass}>District (Comuna)</label>
                <input type="text" name="comuna" value={formData.comuna} onChange={handleChange} className={inputClass} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="latitude" className={labelClass}>Latitude</label>
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="longitude" className={labelClass}>Longitude</label>
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className={inputClass} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="imageUrl" className={labelClass}>Image URL</label>
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClass} />
            </div>
             <div>
                <label htmlFor="homepageUrl" className={labelClass}>Homepage URL</label>
                <input type="url" name="homepageUrl" value={formData.homepageUrl} onChange={handleChange} className={inputClass} />
            </div>
        </div>

        <div className="flex items-center">
            <input type="checkbox" id="isPopular" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500" />
            <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-300">Mark as Popular</label>
        </div>


        <div className="pt-6 border-t border-gray-700 flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition">
                Cancel
            </button>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition">
                Save Event
            </button>
        </div>
    </form>
  );
};

export default EventForm;