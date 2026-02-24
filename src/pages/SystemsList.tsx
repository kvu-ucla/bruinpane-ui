import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAllRecordingStates, usePlaceOSSystems } from '../hooks/usePlaceOS';
import { SystemCard } from '../components/SystemCard';
import { SystemCardSkeleton } from '../components/SystemCardSkeleton';

export const SystemsList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { data, isLoading, isError, error } = usePlaceOSSystems();
    const recordingStates = useAllRecordingStates();

    const filteredSystems = (data ?? [])
        .filter(system =>
            system.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            system.id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aRecording = recordingStates[a.id] ?? false;
            const bRecording = recordingStates[b.id] ?? false;
            if (aRecording !== bRecording) return aRecording ? -1 : 1;
            return (a.display_name ?? a.name ?? '').localeCompare(
                b.display_name ?? b.name ?? '',
                undefined,
                { sensitivity: 'base' }
            )
        });

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={20} />
                        <input
                            type="text"
                            placeholder="Search rooms..."
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
                    <div className="space-y-2">
                        {Array.from({ length: 5 }, (_, i) => (
                            <SystemCardSkeleton key={i} />
                        ))}
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