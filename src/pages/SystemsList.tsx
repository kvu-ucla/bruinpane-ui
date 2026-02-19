import { useState } from 'react';
import { Search } from 'lucide-react';
import { useInfiniteSystems } from '../hooks/useSystems';
import { SystemCard } from '../components/SystemCard';

export const SystemsList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading, isError, error } = useInfiniteSystems();

    const systems = data?.pages.flatMap(page => page.systems) ?? [];
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
                {!isLoading && (
                    <div className="mt-2 text-sm text-base-content/60">
                        {filteredSystems.length} items
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                )}

                {isError && (
                    <div className="alert alert-error">
                        <span>{error instanceof Error ? error.message : 'Failed to load systems'}</span>
                    </div>
                )}

                {!isLoading && !isError && filteredSystems.length === 0 && (
                    <div className="text-center py-12 text-base-content/60">
                        {searchQuery ? 'No systems found matching your search' : 'No systems available'}
                    </div>
                )}

                {!isLoading && !isError && filteredSystems.length > 0 && (
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