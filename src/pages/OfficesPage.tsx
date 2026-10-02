import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Phone, Mail, Clock, Globe, Search, Filter, X, Navigation, Building2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { OfficeResponse } from '../types';
import { OFFICE_REGIONS } from '../types';

export default function OfficesPage() {
  const [offices, setOffices] = useState<OfficeResponse[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Map
  const [selectedOffice, setSelectedOffice] = useState<OfficeResponse | null>(null);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await apiClient.getAllOffices();
      const officeList = Array.isArray(res) ? res : res?.data ?? [];
      setOffices(officeList);

      const countrySet = new Set(officeList.map((o: OfficeResponse) => o.country).filter(Boolean));
      setCountries(Array.from(countrySet) as string[]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load offices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // Filtering is derived state, not state of its own: computing it in an effect
  // meant an extra render per keystroke (and a setState-in-effect cascade) for
  // something useMemo derives directly from the inputs.
  const filteredOffices = useMemo(() => {
    let result = offices;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.name.toLowerCase().includes(query) ||
        o.city?.toLowerCase().includes(query) ||
        o.country?.toLowerCase().includes(query) ||
        o.address.toLowerCase().includes(query) ||
        o.code.toLowerCase().includes(query)
      );
    }
    if (selectedRegion) result = result.filter(o => o.region === selectedRegion);
    if (selectedCountry) result = result.filter(o => o.country === selectedCountry);
    return result;
  }, [offices, searchQuery, selectedRegion, selectedCountry]);

  const clearFilters = () => { setSearchQuery(''); setSelectedRegion(''); setSelectedCountry(''); };
  const hasActiveFilters = searchQuery || selectedRegion || selectedCountry;

  const handleViewOnMap = (office: OfficeResponse) => {
    if (office.latitude && office.longitude) setSelectedOffice(office);
  };

  const officesByRegion = filteredOffices.reduce((acc, office) => {
    const region = office.region || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(office);
    return acc;
  }, {} as Record<string, OfficeResponse[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6f00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading offices...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-[#ff6f00]" />
            <h1 className="text-4xl md:text-5xl font-bold">Global Offices</h1>
          </div>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">Find a ShipNexaro location near you. We operate across {OFFICE_REGIONS.length} regions worldwide.</p>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by name, city, country, or address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent outline-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-[#ff6f00] text-white border-[#ff6f00]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#ff6f00]'}`}>
              <Filter className="w-5 h-5" /> Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /> Clear</button>}
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select value={selectedRegion} onChange={e => { setSelectedRegion(e.target.value); setSelectedCountry(''); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] outline-none">
                  <option value="">All Regions</option>
                  {OFFICE_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6f00] outline-none">
                  <option value="">All Countries</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <p className="text-gray-500">Showing <span className="font-semibold text-gray-900">{filteredOffices.length}</span> of {offices.length} offices{hasActiveFilters && ' (filtered)'}</p>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Navigation className="w-5 h-5 text-[#ff6f00]" /> Office Locations</h2>
          </div>
          <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
            <div className="text-center"><MapPin className="w-16 h-16 text-[#ff6f00] mx-auto mb-4" /><p className="text-gray-600 font-medium">Interactive Map</p><p className="text-sm text-gray-500 mt-1">{filteredOffices.filter(o => o.latitude && o.longitude).length} office locations</p></div>
            {selectedOffice && (<div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-lg p-4 border border-gray-100"><div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-gray-900">{selectedOffice.name}</h3><button onClick={() => setSelectedOffice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div><div className="space-y-1.5 text-sm text-gray-600"><p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[#ff6f00] mt-0.5 flex-shrink-0" />{selectedOffice.address}{selectedOffice.city ? `, ${selectedOffice.city}` : ''}</p>{selectedOffice.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#ff6f00] flex-shrink-0" />{selectedOffice.phone}</p>}{selectedOffice.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#ff6f00] flex-shrink-0" />{selectedOffice.email}</p>}{selectedOffice.openingHours && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#ff6f00] flex-shrink-0" />{selectedOffice.openingHours}</p>}</div></div>)}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        {filteredOffices.length === 0 ? (
          <div className="text-center py-16"><Building2 className="w-20 h-20 text-gray-200 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">No offices found</h3><p className="text-gray-500">{hasActiveFilters ? 'Try adjusting your filters.' : 'No offices available.'}</p></div>
        ) : (
          Object.entries(officesByRegion).map(([region, regionOffices]) => (
            <div key={region} className="mb-10">
              <div className="flex items-center gap-3 mb-6"><Globe className="w-6 h-6 text-[#ff6f00]" /><h2 className="text-2xl font-bold text-gray-900">{region}</h2><span className="text-sm text-gray-500">({regionOffices.length})</span></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionOffices.map(office => (
                  <div key={office.id} className={`bg-white rounded-2xl shadow-md border transition-all hover:shadow-lg ${selectedOffice?.id === office.id ? 'border-[#ff6f00] ring-2 ring-[#ff6f00]/20' : 'border-gray-100'}`}>
                    <div className="p-5 border-b border-gray-50"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-[#ff6f00] to-[#ff8f00] rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div><div><h3 className="font-semibold text-gray-900">{office.name}</h3><div className="flex items-center gap-2 mt-0.5"><span className="text-xs bg-[#1a237e]/10 text-[#1a237e] px-2 py-0.5 rounded-full font-medium">{office.code}</span><span className="text-xs text-gray-400">{office.type}</span></div></div></div><span className={`w-2.5 h-2.5 rounded-full ${office.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span></div></div>
                    <div className="p-5 space-y-3"><div className="flex items-start gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4 text-[#ff6f00] mt-0.5 flex-shrink-0" /><span>{office.address}{office.city ? `, ${office.city}` : ''}{office.state ? `, ${office.state}` : ''}{office.country ? `, ${office.country}` : ''}</span></div>{office.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-[#ff6f00] flex-shrink-0" /><a href={`tel:${office.phone}`} className="hover:text-[#ff6f00]">{office.phone}</a></div>}{office.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-4 h-4 text-[#ff6f00] flex-shrink-0" /><a href={`mailto:${office.email}`} className="hover:text-[#ff6f00]">{office.email}</a></div>}{office.openingHours && <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4 text-[#ff6f00] flex-shrink-0" /><span>{office.openingHours}</span></div>}</div>
                    <div className="px-5 pb-5 flex gap-2">{office.latitude && office.longitude && <button onClick={() => handleViewOnMap(office)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a237e] text-white rounded-xl hover:bg-[#283593] text-sm font-medium"><Navigation className="w-4 h-4" /> View on Map</button>}{office.phone && <a href={`tel:${office.phone}`} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:border-[#ff6f00] hover:text-[#ff6f00] text-sm font-medium"><Phone className="w-4 h-4" /> Contact</a>}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
