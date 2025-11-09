import React, { useState } from 'react';
import { AdItem } from '../types';

interface AdFormProps {
  ad: AdItem | null;
  onSave: (ad: AdItem) => void;
  onCancel: () => void;
}

const AdForm: React.FC<AdFormProps> = ({ ad, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    description: ad?.description || '',
    imageUrl: ad?.imageUrl || '',
    sponsor: ad?.sponsor || '',
    url: ad?.url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: ad?.id || `ad-${Date.now()}`,
    });
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">
        {ad ? 'Edit Ad' : 'Create New Ad'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="sponsor" className={labelClass}>Sponsor</label>
          <input type="text" name="sponsor" value={formData.sponsor} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={3} required></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="imageUrl" className={labelClass}>Image URL</label>
          <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="url" className={labelClass}>Target URL</label>
          <input type="url" name="url" value={formData.url} onChange={handleChange} className={inputClass} required />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-700 flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition">
          Cancel
        </button>
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition">
          Save Ad
        </button>
      </div>
    </form>
  );
};

export default AdForm;
