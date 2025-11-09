import React, { useState, useEffect } from 'react';
import { AdItem, EventItem, CategoryNode } from '../types';
import { CloseIcon } from './IconComponents';
import EventForm from './EventForm';
import AdForm from './AdForm';

interface AdminConsoleProps {
  events: EventItem[];
  ads: AdItem[];
  categories: CategoryNode[];
  onUpdateEvents: (events: EventItem[]) => void;
  onUpdateAds: (ads: AdItem[]) => void;
  onUpdateCategories: (categories: CategoryNode[]) => void;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'events' | 'ads' | 'import' | 'categories' | 'docs';

type EventField = keyof EventItem;

const AdminConsole: React.FC<AdminConsoleProps> = ({ events, ads, categories, onUpdateEvents, onUpdateAds, onUpdateCategories, onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingEvent, setEditingEvent] = useState<EventItem | 'new' | null>(null);
  const [editingAd, setEditingAd] = useState<AdItem | 'new' | null>(null);

  const [categoriesJson, setCategoriesJson] = useState(() => JSON.stringify(categories, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  
  const [requiredFields, setRequiredFields] = useState<Record<EventField, boolean>>({
    id: false,
    title: true,
    description: true,
    longDescription: true,
    startDate: true,
    endDate: false,
    type: true,
    location: true,
    comuna: true,
    imageUrl: true,
    isPopular: true,
    latitude: true,
    longitude: true,
    homepageUrl: false,
    price: false,
  });

  const handleRequiredChange = (fieldName: EventField, isChecked: boolean) => {
    setRequiredFields(prev => ({ ...prev, [fieldName]: isChecked }));
  };

  const schemaDefinition: Array<{ name: EventField, type: string, description: string, nonToggleable?: boolean }> = [
    { name: 'id', type: 'number', description: 'Unique ID. *Required for updates/deletes, but auto-generated for new events.', nonToggleable: true },
    { name: 'title', type: 'string', description: 'The main title of the event.' },
    { name: 'description', type: 'string', description: 'A short, one-sentence description for cards.' },
    { name: 'longDescription', type: 'string', description: 'A detailed description for the event modal. Can include newlines.' },
    { name: 'startDate', type: 'string', description: 'Event start date in YYYY-MM-DD format.' },
    { name: 'endDate', type: 'string', description: 'Optional end date in YYYY-MM-DD format for multi-day events.' },
    { name: 'type', type: 'string', description: 'Category path using \'>\' as a separator (e.g., "Music>Concert").' },
    { name: 'location', type: 'string', description: 'Name of the venue or location.' },
    { name: 'comuna', type: 'string', description: 'The district or city area (e.g., "Providencia").' },
    { name: 'imageUrl', type: 'string', description: 'A direct URL to a high-quality promotional image.' },
    { name: 'price', type: 'number', description: 'Optional price in CLP. 0 for free, omit for unknown.' },
    { name: 'isPopular', type: 'boolean', description: '`true` if the event is featured, otherwise `false`.' },
    { name: 'latitude', type: 'number', description: 'GPS latitude for map display.' },
    { name: 'longitude', type: 'number', description: 'GPS longitude for map display.' },
    { name: 'homepageUrl', type: 'string', description: 'Optional URL to the event\'s official website.' },
  ];


  useEffect(() => {
    // If categories are updated from outside (unlikely in this app, but good practice),
    // reflect it in the textarea.
    setCategoriesJson(JSON.stringify(categories, null, 2));
  }, [categories]);

  const handleCategoriesSave = () => {
    try {
      const newCategories = JSON.parse(categoriesJson);
      // NOTE: In a real app, you'd add schema validation here (e.g., with Zod)
      // to ensure the structure is correct before updating state.
      onUpdateCategories(newCategories);
      setJsonError(null);
      alert('Categories updated successfully!');
    } catch (e) {
      setJsonError('Invalid JSON format. Please check the syntax and try again.');
      console.error(e);
    }
  };

  const handleEventDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      onUpdateEvents(events.filter(e => e.id !== id));
    }
  };
  
  const handleEventSave = (eventToSave: EventItem) => {
    if (editingEvent === 'new') {
        const newEvent = { ...eventToSave, id: Date.now() }; // Simulate unique ID
        onUpdateEvents([newEvent, ...events]);
    } else {
        onUpdateEvents(events.map(e => e.id === eventToSave.id ? eventToSave : e));
    }
    setEditingEvent(null);
  };
  
  const handleAdDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      onUpdateAds(ads.filter(ad => ad.id !== id));
    }
  };

  const handleAdSave = (adToSave: AdItem) => {
    if (editingAd === 'new') {
      const newAd = { ...adToSave, id: `ad-${Date.now()}` };
      onUpdateAds([newAd, ...ads]);
    } else {
      onUpdateAds(ads.map(ad => ad.id === adToSave.id ? adToSave : ad));
    }
    setEditingAd(null);
  };


  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`Simulating import of "${file.name}". In a real app, this would be parsed and validated.`);
    // In a real app:
    // 1. Read file content.
    // 2. Parse CSV to JSON.
    // 3. Validate data structure.
    // 4. onUpdateEvents([...newEvents, ...events]);
    e.target.value = ''; // Reset file input
  };
  
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`Simulating import of "${file.name}". In a real app, this would be parsed and validated.`);
     e.target.value = ''; // Reset file input
  };

  const handleApiImport = () => {
    const url = prompt('Enter API endpoint URL:');
    if (url) {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      alert(`Simulating fetch from "${url}" with headers: ${JSON.stringify(headers, null, 2)}`);
      // In a real app:
      // 1. Fetch data from URL with headers.
      // 2. Validate data.
      // 3. onUpdateEvents([...newEvents, ...events]);
    }
  };


  const TabButton: React.FC<{ tab: AdminTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm w-full text-left font-semibold rounded-md transition-colors ${
        activeTab === tab ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 p-4 sm:p-8 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full h-full flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Admin Console</h1>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700" aria-label="Close admin console">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-grow overflow-hidden">
          <nav className="w-48 p-4 border-r border-gray-700 flex-shrink-0 flex flex-col gap-2">
            <TabButton tab="dashboard" label="Dashboard" />
            <TabButton tab="events" label="Events" />
            <TabButton tab="ads" label="Ads" />
            <TabButton tab="import" label="Import" />
            <TabButton tab="categories" label="Categories" />
            <TabButton tab="docs" label="API & Docs" />
          </nav>
          <main className="flex-grow p-6 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium">Total Events</h3>
                        <p className="text-3xl font-bold text-white mt-1">{events.length}</p>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium">Total Ads</h3>
                        <p className="text-3xl font-bold text-white mt-1">{ads.length}</p>
                    </div>
                     <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium">Popular Events</h3>
                        <p className="text-3xl font-bold text-white mt-1">{events.filter(e => e.isPopular).length}</p>
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'events' && (
              <div>
                 {editingEvent ? (
                    <EventForm
                        event={editingEvent === 'new' ? null : editingEvent}
                        onSave={handleEventSave}
                        onCancel={() => setEditingEvent(null)}
                    />
                 ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-white">Manage Events</h2>
                           <button onClick={() => setEditingEvent('new')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition">
                                Add New Event
                           </button>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                           <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Title</th>
                                        <th scope="col" className="px-6 py-3">Start Date</th>
                                        <th scope="col" className="px-6 py-3">Type</th>
                                        <th scope="col" className="px-6 py-3">Popular</th>
                                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event.id} className="border-b border-gray-600 hover:bg-gray-700">
                                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{event.title}</td>
                                            <td className="px-6 py-4">{event.startDate}</td>
                                            <td className="px-6 py-4">{event.type}</td>
                                            <td className="px-6 py-4">{event.isPopular ? 'Yes' : 'No'}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => setEditingEvent(event)} className="font-medium text-cyan-400 hover:underline">Edit</button>
                                                <button onClick={() => handleEventDelete(event.id)} className="font-medium text-red-500 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                    </>
                 )}
              </div>
            )}
             {activeTab === 'ads' && (
              <div>
                {editingAd ? (
                  <AdForm
                    ad={editingAd === 'new' ? null : editingAd}
                    onSave={handleAdSave}
                    onCancel={() => setEditingAd(null)}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-white">Manage Ads</h2>
                      <button onClick={() => setEditingAd('new')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition">
                        Add New Ad
                      </button>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3">Title</th>
                            <th scope="col" className="px-6 py-3">Sponsor</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ads.map(ad => (
                            <tr key={ad.id} className="border-b border-gray-600 hover:bg-gray-700">
                              <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{ad.title}</td>
                              <td className="px-6 py-4">{ad.sponsor}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => setEditingAd(ad)} className="font-medium text-cyan-400 hover:underline">Edit</button>
                                <button onClick={() => handleAdDelete(ad.id)} className="font-medium text-red-500 hover:underline">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === 'import' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Import Events</h2>
                <div className="space-y-8">
                    <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-3">Import from CSV</h3>
                        <p className="text-sm text-gray-400 mb-4">Upload a CSV file with event data. Ensure the column headers match the fields in the data schema (see API & Docs tab).</p>
                        <input type="file" accept=".csv" onChange={handleCsvImport} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"/>
                    </div>
                     <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-3">Import from JSON</h3>
                        <p className="text-sm text-gray-400 mb-4">Upload a JSON file containing an array of event objects that conform to the data schema.</p>
                        <input type="file" accept=".json" onChange={handleJsonImport} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"/>
                    </div>
                    <div className="bg-gray-700 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-3">Import from API Endpoint</h3>
                        <p className="text-sm text-gray-400 mb-4">Fetch events from a remote API. The endpoint should return a JSON array of event objects. If your API requires authentication, enter the key below.</p>
                        <div className='flex flex-col sm:flex-row gap-4 items-center'>
                           <input
                              type="text"
                              placeholder="Enter your API Key (optional)"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="w-full sm:w-80 bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            />
                            <button onClick={handleApiImport} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition w-full sm:w-auto">
                                Fetch from API
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'categories' && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">Manage Categories</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Edit the category structure below. Ensure you maintain the correct JSON format including `name`, `color`, and `subCategories` properties.
                </p>
                
                <textarea
                  className="w-full h-96 bg-gray-900 border border-gray-600 rounded-md p-4 font-mono text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  value={categoriesJson}
                  onChange={(e) => setCategoriesJson(e.target.value)}
                  spellCheck="false"
                  aria-label="Category JSON editor"
                />

                {jsonError && <p className="text-red-400 text-sm mt-2">{jsonError}</p>}
                
                <div className="mt-4">
                  <button onClick={handleCategoriesSave} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition">
                    Save Categories
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'docs' && (
              <div className="text-gray-300 space-y-8">
                <h2 className="text-3xl font-semibold text-white mb-6">API & Data Documentation</h2>
                
                <section>
                    <h3 className="text-2xl font-semibold text-cyan-400 mb-4">Event Data Schema</h3>
                    <p className="mb-4 text-gray-400">This is the structure required for all event objects. Use the checkboxes below to configure which fields are mandatory for API submissions and data imports.</p>
                    <div className="overflow-x-auto bg-gray-700/50 rounded-lg border border-gray-600">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-700 text-left">
                                <tr>
                                    <th className="p-3">Field</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3 text-center">Required</th>
                                    <th className="p-3">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schemaDefinition.map((field, index) => (
                                    <tr key={field.name} className={index < schemaDefinition.length - 1 ? "border-b border-gray-600" : ""}>
                                        <td className="p-3 font-mono">{field.name}</td>
                                        <td className="p-3 font-mono">{field.type}</td>
                                        <td className="p-3 text-center">
                                            {field.nonToggleable ? (
                                                <span className={requiredFields[field.name] ? "text-green-400" : "text-yellow-400"}>
                                                    {requiredFields[field.name] ? 'Yes' : 'No*'}
                                                </span>
                                            ) : (
                                                <input 
                                                    type="checkbox"
                                                    checked={requiredFields[field.name]}
                                                    onChange={(e) => handleRequiredChange(field.name, e.target.checked)}
                                                    className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-500 focus:ring-2 focus:ring-offset-gray-700 focus:ring-offset-2 cursor-pointer"
                                                />
                                            )}
                                        </td>
                                        <td className="p-3">{field.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                
                <section>
                    <h3 className="text-2xl font-semibold text-cyan-400 mb-4">API Endpoints (Hypothetical)</h3>
                    <p className="mb-4 text-gray-400">This is a frontend-only demo. For a production application, you would build a backend with endpoints like these to manage your data.</p>
                    <div className="space-y-2 font-mono text-sm">
                        <p><span className="font-bold text-green-400">GET&nbsp;&nbsp;&nbsp;&nbsp;</span> /api/events &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Retrieve all events</p>
                        <p><span className="font-bold text-cyan-400">POST&nbsp;&nbsp;&nbsp;</span> /api/events &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Create a new event</p>
                        <p><span className="font-bold text-yellow-400">PUT&nbsp;&nbsp;&nbsp;&nbsp;</span> /api/events/:id &nbsp;&nbsp;- Update an event</p>
                        <p><span className="font-bold text-red-400">DELETE&nbsp;</span> /api/events/:id &nbsp;&nbsp;- Delete an event</p>
                    </div>
                </section>

                 <section>
                    <h3 className="text-2xl font-semibold text-cyan-400 mb-4">Authentication</h3>
                    <p className="mb-4 text-gray-400">To protect your API from unauthorized access, all requests should be authenticated using an API key sent as a Bearer Token in the Authorization header.</p>
                    <pre className="bg-gray-900 p-4 rounded-lg text-sm border border-gray-600"><code>Authorization: Bearer YOUR_SECRET_API_KEY</code></pre>
                    <p className="mt-2 text-xs text-gray-500">You can set the API key to use for fetching data in the "Import" tab.</p>
                </section>

              </div>
            )}
          </main>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminConsole;