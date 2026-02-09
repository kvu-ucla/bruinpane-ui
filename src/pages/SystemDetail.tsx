import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSystemById, getSystemModules } from '../services/placeos';
import { PlaceSystem, PlaceModule } from '@placeos/ts-client';
import PTZControls from '../components/PTZControls';
import CameraSelector from '../components/CameraSelector';
import SystemInfo from '../components/SystemInfo';
import SystemFeatures from '../components/SystemFeatures';
import SystemZones from '../components/SystemZones';
import SystemModules from '../components/SystemModules';

interface LocationState {
    system?: PlaceSystem;
    modules?: PlaceModule[];
}

export default function SystemDetail() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [searchParams, setSearchParams] = useSearchParams();

    // Try to get from location state first
    const [system, setSystem] = useState<PlaceSystem | null>(locationState?.system || null);
    const [modules, setModules] = useState<PlaceModule[]>(locationState?.modules || []);
    const [loading, setLoading] = useState(!locationState?.system);
    const [error, setError] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch if we don't have data from state
        if (id && !locationState?.system) {
            void loadSystem(id);
        }
    }, [id, locationState]);

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
                const moduleData = await getSystemModules([...data.modules]);
                setModules(moduleData);
            }
        } catch (err) {
            console.error('Error loading system:', err);
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
                            {selectedCameraModule && (
                                <div className="card bg-base-200">
                                    <div className="card-body">
                                        <PTZControls
                                            systemId={system.id}
                                            cameraModule={selectedCameraModule.id}
                                            moduleInfo={selectedCameraModule}
                                        />
                                    </div>
                                </div>
                            )}

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