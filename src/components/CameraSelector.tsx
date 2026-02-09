import { useEffect, useState } from 'react';
import { CameraPreview } from '../types';

interface CameraSelectorProps {
    cameraPreviews: CameraPreview[];
    selectedCamera: string | null;
    onCameraSelect: (cameraReference: string) => void;
}

export default function CameraSelector({
                                           cameraPreviews,
                                           selectedCamera,
                                           onCameraSelect,
                                       }: CameraSelectorProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const count = cameraPreviews.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card bg-base-200">
            <div className="card-body">
                <h2 className="card-title">Available Cameras ({count})</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    {cameraPreviews.map((preview, idx) => (
                        <button
                            key={idx}
                            onClick={() => onCameraSelect(preview.module)}
                            className={`w-48 h-48 rounded-lg overflow-hidden bg-base-300 relative group hover:ring-4 hover:ring-primary transition-all ${
                                selectedCamera === preview.module ? 'ring-4 ring-primary' : ''
                            }`}
                        >
                            <img
                                src={`${preview.url}&t=${refreshKey}`}
                                alt={preview.label}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <div className="text-white text-sm font-medium truncate">
                                    {preview.label}
                                </div>
                                <div className="text-white/60 text-xs font-mono truncate mt-1">
                                    {preview.module}
                                </div>
                            </div>
                            {selectedCamera === preview.module && (
                                <div className="absolute top-2 right-2 badge badge-primary badge-sm">
                                    Active
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}