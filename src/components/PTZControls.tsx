import { useState, useRef, useEffect } from 'react';
import { Home } from 'lucide-react';
import { executeCameraCommand } from '../services/placeos';
import { ModuleData } from '../models';

interface PTZControlsProps {
  systemId: string;
  cameraModule: string;
  moduleInfo?: ModuleData;
}

export default function PTZControls({ systemId, cameraModule, moduleInfo }: PTZControlsProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoomPosition, setZoomPosition] = useState(0);
  const [isZoomDragging, setIsZoomDragging] = useState(false);
  const joystickRef = useRef<SVGSVGElement>(null);
  const zoomJoystickRef = useRef<SVGSVGElement>(null);
  const commandIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommandRef = useRef<string>('');
  const lastZoomCommandRef = useRef<string>('');

  const executeCommand = async (method: string, args: any[] = []) => {
    try {
      await executeCameraCommand(systemId, cameraModule, method, args);
    } catch (error) {
      console.error('PTZ command failed:', error);
    }
  };

  const getDirectionFromPosition = (x: number, y: number) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const distance = Math.sqrt(x * x + y * y);

    if (distance < 10) return null;

    if (angle >= -45 && angle < 45) return 'right';
    if (angle >= 45 && angle < 135) return 'down';
    if (angle >= -135 && angle < -45) return 'up';
    return 'left';
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    updateJoystickPosition(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    executeCommand('stop');
    if (commandIntervalRef.current) {
      clearInterval(commandIntervalRef.current);
      commandIntervalRef.current = null;
    }
    lastCommandRef.current = '';
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = clientX - centerX;
    let y = clientY - centerY;

    const maxDistance = 80;
    const distance = Math.sqrt(x * x + y * y);

    if (distance > maxDistance) {
      x = (x / distance) * maxDistance;
      y = (y / distance) * maxDistance;
    }

    setJoystickPosition({ x, y });

    const direction = getDirectionFromPosition(x, y);
    if (direction) {
      const command = direction === 'up' || direction === 'down' ? 'tilt' : 'pan';
      const arg = direction === 'up' ? 'up' : direction === 'down' ? 'down' : direction === 'left' ? 'left' : 'right';
      const commandKey = `${command}-${arg}`;

      if (lastCommandRef.current !== commandKey) {
        lastCommandRef.current = commandKey;
        executeCommand(command, [arg]);

        if (commandIntervalRef.current) {
          clearInterval(commandIntervalRef.current);
        }

        commandIntervalRef.current = setInterval(() => {
          executeCommand(command, [arg]);
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (commandIntervalRef.current) {
        clearInterval(commandIntervalRef.current);
      }
      if (zoomIntervalRef.current) {
        clearInterval(zoomIntervalRef.current);
      }
    };
  }, []);

  const handleZoomMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsZoomDragging(true);
    updateZoomPosition(e.clientY);
  };

  const handleZoomMouseMove = (e: MouseEvent) => {
    if (isZoomDragging) {
      updateZoomPosition(e.clientY);
    }
  };

  const handleZoomMouseUp = () => {
    setIsZoomDragging(false);
    setZoomPosition(0);
    executeCommand('stop');
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
    lastZoomCommandRef.current = '';
  };

  const updateZoomPosition = (clientY: number) => {
    if (!zoomJoystickRef.current) return;

    const rect = zoomJoystickRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let y = clientY - centerY;

    const maxDistance = 80;
    if (Math.abs(y) > maxDistance) {
      y = (y / Math.abs(y)) * maxDistance;
    }

    setZoomPosition(y);

    if (Math.abs(y) > 10) {
      const direction = y < 0 ? 'in' : 'out';
      const commandKey = `zoom-${direction}`;

      if (lastZoomCommandRef.current !== commandKey) {
        lastZoomCommandRef.current = commandKey;
        executeCommand('zoom', [direction]);

        if (zoomIntervalRef.current) {
          clearInterval(zoomIntervalRef.current);
        }

        zoomIntervalRef.current = setInterval(() => {
          executeCommand('zoom', [direction]);
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (isZoomDragging) {
      window.addEventListener('mousemove', handleZoomMouseMove);
      window.addEventListener('mouseup', handleZoomMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleZoomMouseMove);
      window.removeEventListener('mouseup', handleZoomMouseUp);
    };
  }, [isZoomDragging]);

  const handleHome = () => {
    setIsExecuting(true);
    executeCommand('home').finally(() => setIsExecuting(false));
  };

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

      <div className="flex items-center justify-center gap-8">
        {/* Zoom Joystick */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
            Zoom
          </div>

          <svg
            ref={zoomJoystickRef}
            width="100"
            height="280"
            viewBox="0 0 100 280"
            className="drop-shadow-lg"
            onMouseDown={handleZoomMouseDown}
            style={{ cursor: isZoomDragging ? 'grabbing' : 'grab' }}
          >
            {/* Track background */}
            <rect
              x="30"
              y="20"
              width="40"
              height="240"
              rx="20"
              fill="rgba(30,30,40,0.8)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />

            {/* Direction indicators */}
            <path d="M 50 30 L 60 50 L 40 50 Z" fill="rgba(255,255,255,0.9)" />
            <text x="50" y="20" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="bold">IN</text>

            <path d="M 50 250 L 60 230 L 40 230 Z" fill="rgba(255,255,255,0.9)" />
            <text x="50" y="273" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="bold">OUT</text>

            {/* Center line */}
            <line x1="30" y1="140" x2="70" y2="140" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3,3" />

            {/* Draggable slider knob */}
            <rect
              x="25"
              y={135 + zoomPosition}
              width="50"
              height="10"
              rx="5"
              fill="rgba(255,255,255,0.95)"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
              style={{ cursor: isZoomDragging ? 'grabbing' : 'grab' }}
            />
          </svg>
        </div>

        {/* PTZ Joystick */}
        <div className="relative select-none">
          <svg
            ref={joystickRef}
            width="280"
            height="280"
            viewBox="0 0 280 280"
            className="drop-shadow-lg"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Main circle background */}
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="rgba(30,30,40,0.8)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />

            {/* Direction indicators */}
            <path d="M 140 20 L 155 55 L 125 55 Z" fill="rgba(255,255,255,0.9)" />
            <path d="M 140 260 L 155 225 L 125 225 Z" fill="rgba(255,255,255,0.9)" />
            <path d="M 20 140 L 55 125 L 55 155 Z" fill="rgba(255,255,255,0.9)" />
            <path d="M 260 140 L 225 125 L 225 155 Z" fill="rgba(255,255,255,0.9)" />

            {/* Corner indicators */}
            <rect x="90" y="90" width="10" height="10" fill="rgba(255,255,255,0.5)" />
            <rect x="180" y="90" width="10" height="10" fill="rgba(255,255,255,0.5)" />
            <rect x="90" y="180" width="10" height="10" fill="rgba(255,255,255,0.5)" />
            <rect x="180" y="180" width="10" height="10" fill="rgba(255,255,255,0.5)" />

            {/* Draggable center knob */}
            <circle
              cx={140 + joystickPosition.x}
              cy={140 + joystickPosition.y}
              r="32"
              fill="rgba(255,255,255,0.95)"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            />

            {/* Center knob inner circle */}
            <circle
              cx={140 + joystickPosition.x}
              cy={140 + joystickPosition.y}
              r="20"
              fill="rgba(200,200,200,0.4)"
              pointerEvents="none"
            />
          </svg>
        </div>
      </div>

      {/* Home Button */}
      <button
        onClick={handleHome}
        className="btn btn-outline btn-block gap-2"
        disabled={isExecuting}
        title="Home Position"
      >
        <Home size={18} />
        <span>Home Position</span>
      </button>
    </div>
  );
}
