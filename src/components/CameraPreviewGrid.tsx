import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CameraPreview } from '../types';

type CameraPreviewGridProps = {
    previews: ReadonlyArray<CameraPreview>;
    systemId: string;
};

const REFRESH_INTERVAL_MS = 3000;

export const CameraPreviewGrid = ({ previews, systemId }: CameraPreviewGridProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const displayedPreviews = previews.slice(0, 3);
    const remainingCount = previews.length - 3;

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-shrink-0">
            <div className="flex gap-2">
                {displayedPreviews.map((preview) => (
                    <Link
                        key={preview.channelId}
                        to={`/systems/${systemId}?channel=${encodeURIComponent(preview.channelId)}`}
                        className="w-48 h-48 rounded-lg overflow-hidden bg-base-300 relative group hover:ring-4 hover:ring-primary transition-all"
                    >
                        <img
                            src={`${preview.url}&t=${refreshKey}`}
                            alt={preview.label}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="text-white text-sm font-medium">{preview.label}</div>
                        </div>
                    </Link>
                ))}
                {remainingCount > 0 && (
                    <Link
                        to={`/systems/${systemId}`}
                        className="w-48 h-48 rounded-lg bg-base-300 flex items-center justify-center text-2xl font-bold text-base-content/60 hover:bg-base-content/10 transition-colors"
                    >
                        +{remainingCount}
                    </Link>
                )}
            </div>
            <div className="text-xs text-center mt-1 text-base-content/60">
                {previews.length} camera{previews.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}