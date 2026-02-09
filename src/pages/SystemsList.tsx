import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getSystems } from '../services/placeos';
import { System } from '../models';

export default function SystemsList() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystems();
      console.log('Systems data:', data);
      setSystems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading systems:', err);
      setError(err instanceof Error ? err.message : 'Failed to load systems');
    } finally {
      setLoading(false);
    }
  };

  const filteredSystems = systems.filter(system =>
    system.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    system.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={20} />
            <input
              type="text"
              placeholder="Search systems..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {!loading && (
          <div className="mt-2 text-sm text-base-content/60">
            {filteredSystems.length} items
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredSystems.length === 0 && (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? 'No systems found matching your search' : 'No systems available'}
          </div>
        )}

        {!loading && !error && filteredSystems.length > 0 && (
          <div className="space-y-2">
            {filteredSystems.map((system) => {
              const hasCameras = system.camera_previews && system.camera_previews.length > 0;

              return (
                <div
                  key={system.id}
                  className="card bg-base-200"
                >
                  <div className="card-body p-4">
                    <div className="flex gap-4">
                      {hasCameras && (
                        <div className="flex-shrink-0">
                          <div className="flex gap-2">
                            {system.camera_previews!.slice(0, 3).map((preview, idx) => (
                              <Link
                                key={idx}
                                to={`/systems/${system.id}?camera=${encodeURIComponent(preview.module)}`}
                                className="w-48 h-48 rounded-lg overflow-hidden bg-base-300 relative group hover:ring-4 hover:ring-primary transition-all"
                              >
                                <img
                                  src={preview.url}
                                  alt={preview.module}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                  <div className="text-white text-sm font-medium">{preview.label || preview.module}</div>
                                </div>
                              </Link>
                            ))}
                            {system.camera_previews!.length > 3 && (
                              <Link
                                to={`/systems/${system.id}`}
                                className="w-48 h-48 rounded-lg bg-base-300 flex items-center justify-center text-2xl font-bold text-base-content/60 hover:bg-base-content/10 transition-colors"
                              >
                                +{system.camera_previews!.length - 3}
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-center mt-1 text-base-content/60">
                            {system.camera_previews!.length} camera{system.camera_previews!.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      <Link to={`/systems/${system.id}`} className="flex-1 min-w-0 hover:opacity-70 transition-opacity">
                        <h3 className="card-title text-base">{system.name}</h3>
                        <div className="text-xs text-base-content/50 font-mono mt-1">{system.id}</div>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
