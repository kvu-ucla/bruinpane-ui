import { Video } from 'lucide-react';
import { ModuleData } from '../models';

interface CameraFeedProps {
  selectedModule?: ModuleData;
}

export default function CameraFeed({ selectedModule }: CameraFeedProps) {
  if (!selectedModule) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Live Camera Feed</h2>
          <div className="mt-4 text-center py-12 text-base-content/60">
            No camera selected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Live Camera Feed</h2>
        <div className="mt-4">
          <div className="aspect-video bg-base-300 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Video size={64} className="text-base-content/30" />
              <div className="text-center px-4">
                <p className="text-base-content/60 font-medium">
                  MPEG-TS Stream Player
                </p>
                {selectedModule && (
                  <>
                    <p className="text-sm text-base-content/40 mt-2">
                      Camera: {selectedModule.custom_name || selectedModule.name}
                    </p>
                    <p className="text-xs text-base-content/30 mt-1 font-mono">
                      Module ID: {selectedModule.id}
                    </p>
                    {selectedModule.ip && (
                      <p className="text-xs text-base-content/30 mt-1">
                        IP: {selectedModule.ip}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
