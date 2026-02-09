import { Link } from 'react-router-dom';
import { SystemWithPreviews } from '../types';
import CameraPreviewGrid from './CameraPreviewGrid';

interface SystemCardProps {
    system: SystemWithPreviews;
}

export default function SystemCard({ system }: SystemCardProps) {
    const hasCameras = system.camera_previews && system.camera_previews.length > 0;

    return (
        <div className="card bg-base-200">
            <div className="card-body p-4">
                <div className="flex gap-4">
                    {hasCameras && (
                        <CameraPreviewGrid
                            previews={system.camera_previews!}
                            systemId={system.id}
                        />
                    )}
                    <Link to={`/systems/${system.id}`} className="flex-1 min-w-0 hover:opacity-70 transition-opacity">
                        <h3 className="card-title text-base">{system.name}</h3>
                        <div className="text-xs text-base-content/50 font-mono mt-1">{system.id}</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}