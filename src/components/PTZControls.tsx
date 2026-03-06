import { useState, useRef, useEffect } from 'react';
import { Home } from 'lucide-react';
import type { PlaceModule } from '@placeos/ts-client';
import { useAutoframe, usePTZCommand } from '../hooks/usePlaceOS';
import { Joystick } from './Joystick';
import { TeleController } from './TeleController';

type CameraCommand = 'tele' | 'wide' | 'stop' | 'stop_zoom' | 'home';

type PTZControlsProps = {
  systemId: string;
  cameraModule: string;
  moduleInfo?: PlaceModule;
};

export const PTZControls = ({ systemId, cameraModule, moduleInfo }: PTZControlsProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const executePTZCommand = usePTZCommand();
  const isAutoframe = useAutoframe(systemId, cameraModule);
  const currentZoomRef = useRef<'tele' | 'wide' | null>(null);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastJoystickSend = useRef<number>(0);

  const scheduleCommand = (command: CameraCommand) => {
    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => {
      void executePTZCommand(systemId, cameraModule, command);
    }, 50);
  };

  const JOYSTICK_INTERVAL = 50;

  const handleJoystickMove = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastJoystickSend.current >= JOYSTICK_INTERVAL) {
      lastJoystickSend.current = now;
      void executePTZCommand(systemId, cameraModule, 'joystick', [x, y]);
    }
  };

  const handleZoomStart = (dir: 'tele' | 'wide') => {
    if (dir !== currentZoomRef.current) {
      currentZoomRef.current = dir;
      scheduleCommand(dir);
    }
  };

  const handleZoomStop = () => {
    if (currentZoomRef.current !== null) {
      currentZoomRef.current = null;
      scheduleCommand('stop_zoom');
    }
  };

  const handleHome = () => {
    setIsExecuting(true);
    void executePTZCommand(systemId, cameraModule, 'home').finally(() => setIsExecuting(false));
  };

  useEffect(() => {
    return () => {
      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">PTZ Controls</h3>

        <div className="bg-base-300 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
              Target Module
            </span>
            <div className="badge badge-primary badge-sm">Active</div>
          </div>

          {moduleInfo ? (
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium">
                  {moduleInfo.custom_name || moduleInfo.name || 'Unnamed Module'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <span className="text-base-content/60">Module ID:</span>
                  <div className="font-mono text-base-content/90 truncate mt-0.5">
                    {moduleInfo.id}
                  </div>
                </div>

                {moduleInfo.ip && (
                  <div>
                    <span className="text-base-content/60">IP Address:</span>
                    <div className="font-mono text-base-content/90 mt-0.5">
                      {moduleInfo.ip}{moduleInfo.port && `:${moduleInfo.port}`}
                    </div>
                  </div>
                )}

                {moduleInfo.edge_id && (
                  <div>
                    <span className="text-base-content/60">Edge:</span>
                    <div className="font-mono text-base-content/90 truncate mt-0.5">
                      {moduleInfo.edge_id}
                    </div>
                  </div>
                )}

                {moduleInfo.driver_id && (
                  <div className="col-span-2">
                    <span className="text-base-content/60">Driver:</span>
                    <div className="font-mono text-base-content/90 truncate mt-0.5">
                      {moduleInfo.driver_id}
                    </div>
                  </div>
                )}

                {moduleInfo.role !== undefined && (
                  <div>
                    <span className="text-base-content/60">Role:</span>
                    <div className="text-base-content/90 mt-0.5">
                      {moduleInfo.role}
                    </div>
                  </div>
                )}

                {(moduleInfo.connected !== undefined || moduleInfo.running !== undefined) && (
                  <div className="col-span-2">
                    <span className="text-base-content/60">Status:</span>
                    <div className="flex gap-1 mt-0.5">
                      {moduleInfo.connected !== undefined && (
                        <span className={`badge badge-xs ${moduleInfo.connected ? 'badge-success' : 'badge-error'}`}>
                          {moduleInfo.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      )}
                      {moduleInfo.running !== undefined && (
                        <span className={`badge badge-xs ${moduleInfo.running ? 'badge-info' : 'badge-warning'}`}>
                          {moduleInfo.running ? 'Running' : 'Stopped'}
                        </span>
                      )}
                      {moduleInfo.has_runtime_error && (
                        <span className="badge badge-xs badge-error">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs">
              <div className="text-base-content/60">Module ID:</div>
              <div className="font-mono text-base-content/90 truncate mt-1">
                {cameraModule}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '307px', overflow: 'hidden' }}>
        <div
          className="flex items-center justify-center gap-8"
          style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}
        >
          <TeleController
            onZoomStart={handleZoomStart}
            onZoomStop={handleZoomStop}
          />
          <Joystick onMove={handleJoystickMove} />
        </div>
      </div>

      <button
        onClick={handleHome}
        className="btn btn-outline btn-block gap-2"
        disabled={isExecuting}
        title="Home Position"
      >
        <Home size={18} />
        <span>Home Position</span>
      </button>

      {isAutoframe !== null && (
        <button
          onClick={() => void executePTZCommand(systemId, cameraModule, 'autoframe', [!isAutoframe])}
          className={`btn btn-block gap-2 ${isAutoframe ? 'btn-primary' : 'btn-outline'}`}
        >
          <span>Autoframe</span>
          <span className="text-xs opacity-70">{isAutoframe ? 'On' : 'Off'}</span>
        </button>
      )}
    </div>
  );
}
