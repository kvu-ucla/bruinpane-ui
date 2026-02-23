import { Link } from 'react-router-dom';
import type { PlaceSystem } from '@placeos/ts-client';
import { useCameraState, useRecordingState } from '../PlaceOSContext';
import { CameraPreviewGrid } from './CameraPreviewGrid';

type SystemCardProps = {
    system: PlaceSystem;
};

export const SystemCard = ({ system }: SystemCardProps) => {
    const { data: cameraPreviews, isLoading: previewsLoading } = useCameraState(system.id);
    const isRecording = useRecordingState(system.id);

    return (
        <div className={`card bg-base-200 ${isRecording ? 'ring-2 ring-red-500' : ''}`}>
            <div className="card-body p-4">
                <div className="flex gap-4">
                    {previewsLoading ? (
                        <div className="flex-shrink-0 flex gap-2">
                            <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer" />
                            <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer" />
                            <div className="w-48 h-48 rounded-lg bg-base-300 animate-shimmer" />
                        </div>
                    ) : cameraPreviews && cameraPreviews.length > 0 ? (
                        <CameraPreviewGrid
                            previews={cameraPreviews}
                            systemId={system.id}
                        />
                    ) : null}
                    <Link
                        to={`/systems/${system.id}`}
                        className="flex-1 min-w-0 hover:opacity-70 transition-opacity"
                    >
                        <div className="flex items-center gap-2">
                            <h3 className="card-title text-base">{system.display_name}</h3>
                            {isRecording && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            )}
                        </div>
                        <div className="text-xs text-base-content/50 font-mono mt-1">{system.id}</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
