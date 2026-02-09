import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSystemById, getSystemModules } from '../services/placeos';
import PTZControls from '../components/PTZControls';
import CameraFeed from '../components/CameraFeed';
import CameraSelector from '../components/CameraSelector';
import SystemInfo from '../components/SystemInfo';
import SystemFeatures from '../components/SystemFeatures';
import SystemZones from '../components/SystemZones';
import SystemModules from '../components/SystemModules';
import { ModuleData, SystemData } from '../models';

export default function SystemDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [system, setSystem] = useState<SystemData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    if (id) {``
      loadSystem(id);
    }
  }, [id]);

  useEffect(() => {
    const cameraModules = getCameraModules();
    if (cameraModules.length > 0) {
      const cameraParam = searchParams.get('camera');
      if (cameraParam) {
        setSelectedCamera(cameraParam);
      } else {
        setSelectedCamera(cameraModules[0].id);
      }
    }
  }, [system, modules, searchParams]);

  const getCameraModules = () => {
    return modules.filter(module => {
      const name = (module.custom_name || module.name || '').toLowerCase();
      return name.includes('camera') || name.includes('ptz') || name.includes('vision');
    });
  };

  const loadSystem = async (systemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemById(systemId);
      setSystem(data);

      if (data.modules && data.modules.length > 0) {
        const moduleData = await getSystemModules(data.modules);
        setModules(moduleData as ModuleData[]);

        // Add dummy module data if no modules were returned
        if (moduleData.length === 0) {
          const dummyModules: ModuleData[] = [
            {
              id: 'mod-ptz-camera-001',
              name: 'PTZ Camera Module',
              custom_name: 'Conference Room PTZ Camera',
              control_system_id: systemId,
              driver_id: 'driver-sony-ptz-visca-1.0',
              edge_id: 'edge-001',
              ip: '192.168.1.100',
              port: 5678,
              role: 1,
              connected: true,
              running: true,
              has_runtime_error: false,
              ignore_connected: false,
              tls: false,
              udp: false,
              created_at: Date.now() - 86400000,
              updated_at: Date.now() - 3600000,
              version: 1
            },
            {
              id: 'mod-ptz-camera-002',
              name: 'PTZ Camera Module',
              custom_name: 'Auditorium Main Camera',
              control_system_id: systemId,
              driver_id: 'driver-sony-ptz-visca-1.0',
              edge_id: 'edge-001',
              ip: '192.168.1.101',
              port: 5678,
              role: 1,
              connected: true,
              running: true,
              has_runtime_error: false,
              ignore_connected: false,
              tls: false,
              udp: false,
              created_at: Date.now() - 86400000,
              updated_at: Date.now() - 3600000,
              version: 1
            },
            {
              id: 'mod-ptz-camera-003',
              name: 'PTZ Camera Module',
              custom_name: 'Lecture Hall Wide Angle',
              control_system_id: systemId,
              driver_id: 'driver-panasonic-ptz-http-2.1',
              edge_id: 'edge-002',
              ip: '192.168.1.102',
              port: 80,
              role: 2,
              connected: true,
              running: true,
              has_runtime_error: false,
              ignore_connected: false,
              tls: false,
              udp: false,
              uri: 'http://192.168.1.102/api/ptz',
              created_at: Date.now() - 172800000,
              updated_at: Date.now() - 7200000,
              version: 2
            }
          ];
          setModules(dummyModules);
        }
      } else {
        // No modules in system data, add dummy modules
        const dummyModules: ModuleData[] = [
          {
            id: 'mod-ptz-camera-001',
            name: 'PTZ Camera Module',
            custom_name: 'Conference Room PTZ Camera',
            control_system_id: systemId,
            driver_id: 'driver-sony-ptz-visca-1.0',
            edge_id: 'edge-001',
            ip: '192.168.1.100',
            port: 5678,
            role: 1,
            connected: true,
            running: true,
            has_runtime_error: false,
            ignore_connected: false,
            tls: false,
            udp: false,
            created_at: Date.now() - 86400000,
            updated_at: Date.now() - 3600000,
            version: 1
          },
          {
            id: 'mod-ptz-camera-002',
            name: 'PTZ Camera Module',
            custom_name: 'Auditorium Main Camera',
            control_system_id: systemId,
            driver_id: 'driver-sony-ptz-visca-1.0',
            edge_id: 'edge-001',
            ip: '192.168.1.101',
            port: 5678,
            role: 1,
            connected: true,
            running: true,
            has_runtime_error: false,
            ignore_connected: false,
            tls: false,
            udp: false,
            created_at: Date.now() - 86400000,
            updated_at: Date.now() - 3600000,
            version: 1
          },
          {
            id: 'mod-ptz-camera-003',
            name: 'PTZ Camera Module',
            custom_name: 'Lecture Hall Wide Angle',
            control_system_id: systemId,
            driver_id: 'driver-panasonic-ptz-http-2.1',
            edge_id: 'edge-002',
            ip: '192.168.1.102',
            port: 80,
            role: 2,
            connected: true,
            running: true,
            has_runtime_error: false,
            ignore_connected: false,
            tls: false,
            udp: false,
            uri: 'http://192.168.1.102/api/ptz',
            created_at: Date.now() - 172800000,
            updated_at: Date.now() - 7200000,
            version: 2
          }
        ];
        setModules(dummyModules);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <span>System not found</span>
        </div>
      </div>
    );
  }

  const cameraModules = getCameraModules();
  const selectedCameraModule = cameraModules.find((m) => m.id === selectedCamera);

  const handleCameraSelect = (cameraId: string) => {
    setSelectedCamera(cameraId);
    setSearchParams({ camera: cameraId });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/systems" className="btn btn-ghost btn-circle">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{system.display_name || system.name}</h1>
            {selectedCameraModule && (
              <p className="text-sm text-base-content/60 mt-1">
                Viewing: {selectedCameraModule.custom_name || selectedCameraModule.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {cameraModules.length > 0 && (
            <>
              <div className="grid lg:grid-cols-[1fr,auto] gap-6">
                <CameraFeed
                  selectedModule={selectedCameraModule}
                />

                {selectedCameraModule && (
                  <div className="card bg-base-200 w-[480px]">
                    <div className="card-body">
                      <PTZControls
                        systemId={system.id}
                        cameraModule={selectedCameraModule.id}
                        moduleInfo={selectedCameraModule}
                      />
                    </div>
                  </div>
                )}
              </div>

              <CameraSelector
                cameraModules={cameraModules}
                selectedCamera={selectedCamera}
                onCameraSelect={handleCameraSelect}
              />
            </>
          )}

          <SystemInfo system={system} />

          {system.features && <SystemFeatures features={system.features} />}

          {system.zones && <SystemZones zones={system.zones} />}

          {system.modules && <SystemModules moduleIds={system.modules} modules={modules} />}
        </div>
      </div>
    </div>
  );
}
