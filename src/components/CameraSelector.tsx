import { Video } from 'lucide-react';
import { ModuleData } from '../models';

interface CameraSelectorProps {
  cameraModules: ModuleData[];
  selectedCamera: string | null;
  onCameraSelect: (cameraId: string) => void;
}

export default function CameraSelector({
  cameraModules,
  selectedCamera,
  onCameraSelect,
}: CameraSelectorProps) {
  const count = cameraModules.length;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Available Cameras ({count})</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cameraModules.map((module) => (
            <button
              key={module.id}
              onClick={() => onCameraSelect(module.id)}
              className={`w-48 h-48 rounded-lg overflow-hidden bg-base-300 relative group hover:ring-4 hover:ring-primary transition-all ${
                selectedCamera === module.id ? 'ring-4 ring-primary' : ''
              }`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Video size={48} className="text-base-content/30" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-white text-sm font-medium truncate">
                  {module.custom_name || module.name || module.id}
                </div>
                <div className="text-white/60 text-xs font-mono truncate mt-1">
                  {module.id}
                </div>
              </div>
              {selectedCamera === module.id && (
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
