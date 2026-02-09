import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getSystems, getSystemModules } from '../services/placeos';
import { generateCameraPreviews } from '../utils/cameraUtils';
import SystemCard from '../components/SystemCard';
import { SystemWithPreviews } from '../types';

export default function SystemsList() {
  const [systems, setSystems] = useState<SystemWithPreviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystems();

      const systemsWithPreviews = await Promise.all(
          data.map(async (system): Promise<SystemWithPreviews> => {
            if (!system.modules || system.modules.length === 0) {
              return { ...system };
            }

            try {
              const modules = await getSystemModules([...system.modules]);
              const previews = await generateCameraPreviews(system.id, modules);

              return {
                ...system,
                camera_previews: previews.length > 0 ? previews : undefined
              };
            } catch (err) {
              console.error(`Failed to load modules for system ${system.id}:`, err);
              return { ...system };
            }
          })
      );

      setSystems(systemsWithPreviews);
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
                {filteredSystems.map((system) => (
                    <SystemCard key={system.id} system={system} />
                ))}
              </div>
          )}
        </div>
      </div>
  );
}