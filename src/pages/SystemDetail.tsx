import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSystemById, getSystemModules } from '../services/placeos';
import { PlaceSystem, PlaceModule } from '@placeos/ts-client';
import { generateCameraPreviews } from '../utils/cameraUtils';
import PTZControls from '../components/PTZControls';
import CameraSelector from '../components/CameraSelector';
import { CameraPreview } from '../types';

interface LocationState {
    system?: PlaceSystem;
    modules?: PlaceModule[];
    cameraPreviews?: CameraPreview[];
}

export default function SystemDetail() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [searchParams, setSearchParams] = useSearchParams();

    // Try to get from location state first
    const [system, setSystem] = useState<PlaceSystem | null>(locationState?.system || null);
    const [modules, setModules] = useState<PlaceModule[]>(locationState?.modules || []);
    const [cameraPreviews, setCameraPreviews] = useState<CameraPreview[]>(locationState?.cameraPreviews || []);
    const [loading, setLoading] = useState(!locationState?.system);
    const [error, setError] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // Only fetch if we don't have data from state
        if (id && !locationState?.system) {
            void loadSystem(id);
        }
    }, [id, locationState]);

    useEffect(() => {
        // Only generate camera previews if we don't have them from state
        if (system && modules.length > 0 && cameraPreviews.length === 0) {
            void loadCameraPreviews();
        }
    }, [system, modules, cameraPreviews.length]);

    useEffect(() => {
        // Set up camera preview refresh every 3 seconds
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Set selected camera from previews or query params
        if (cameraPreviews.length > 0) {
            const cameraParam = searchParams.get('camera');
            if (cameraParam) {
                setSelectedCamera(cameraParam);
            } else {
                setSelectedCamera(cameraPreviews[0].module);
            }
        }
    }, [cameraPreviews, searchParams]);

    const loadCameraPreviews = async () => {
        if (!system) return;

        try {
            const previews = await generateCameraPreviews(system.id, modules);
            setCameraPreviews(previews);
        } catch (err) {
            console.error('Failed to generate camera previews:', err);
        }
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

    const getRecordingModule = () => {
        const recordingModules = modules.filter(m => m.name === 'Recording');
        return recordingModules[0]; // Recording_1
    };

    const handleCameraSelect = (cameraReference: string) => {
        setSelectedCamera(cameraReference);
        setSearchParams({ camera: cameraReference });
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

    const selectedCameraPreview = cameraPreviews.find(p => p.module === selectedCamera);
    const recordingModule = getRecordingModule();

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-4">
                    <Link to="/systems" className="btn btn-ghost btn-circle">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{system.display_name || system.name}</h1>
                        {selectedCameraPreview && (
                            <p className="text-sm text-base-content/60 mt-1">
                                Viewing: {selectedCameraPreview.label}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {cameraPreviews.length > 0 && recordingModule && (
                        <>
                            <div className="grid lg:grid-cols-[1fr,auto] gap-6">
                                {/* Camera Feed Preview */}
                                {selectedCameraPreview && (
                                    <div className="card bg-base-200">
                                        <div className="card-body">
                                            <h2 className="card-title text-lg mb-4">Camera Feed</h2>
                                            <div className="aspect-video bg-base-300 rounded-lg overflow-hidden">
                                                <img
                                                    src={`${selectedCameraPreview.url}&t=${refreshKey}`}
                                                    alt={selectedCameraPreview.label}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PTZ Controls */}
                                {selectedCameraPreview && (
                                    <div className="card bg-base-200 w-full lg:w-[480px]">
                                        <div className="card-body">
                                            <PTZControls
                                                systemId={system.id}
                                                cameraModule={recordingModule.id}
                                                moduleInfo={recordingModule}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Selector */}
                            {cameraPreviews.length > 1 && (
                                <CameraSelector
                                    cameraModules={cameraPreviews.map(preview => ({
                                        id: preview.module,
                                        name: preview.label,
                                        custom_name: preview.label,
                                    } as PlaceModule))}
                                    selectedCamera={selectedCamera}
                                    onCameraSelect={handleCameraSelect}
                                />
                            )}
                        </>
                    )}

                    {/* No cameras available */}
                    {cameraPreviews.length === 0 && (
                        <div className="alert alert-info">
                            <span>No active camera feeds available for this system</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}