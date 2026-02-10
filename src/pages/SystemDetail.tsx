import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSystem, useCameraPreviews } from '../hooks/useSystems';
import StreamPlayer from '../components/StreamPlayer';
import PTZControls from '../components/PTZControls';
import CameraSelector from '../components/CameraSelector';

export default function SystemDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // Use React Query hooks
    const { data: system, isLoading, isError, error } = useSystem(id);
    const { data: cameraPreviews } = useCameraPreviews(id);

    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

    const modules = system?.loadedModules || [];
    const previews = cameraPreviews || [];

    useEffect(() => {
        if (previews.length > 0) {
            const cameraParam = searchParams.get('camera');
            if (cameraParam) {
                setSelectedCamera(cameraParam);
            } else {
                setSelectedCamera(previews[0].module);
            }
        }
    }, [previews, searchParams]);

    const getRecordingModule = () => {
        const recordingModules = modules.filter(m => m.name === 'Recording');
        return recordingModules[0];
    };

    const getRecordingModuleAddress = () => {
        const recordingModule = getRecordingModule();
        if (!recordingModule) return null;

        if (recordingModule.ip) {
            return recordingModule.ip;
        } else if (recordingModule.uri) {
            try {
                return new URL(recordingModule.uri).hostname;
            } catch {
                return null;
            }
        }
        return null;
    };

    const getChannelForCamera = (cameraModule: string): string | null => {
        const preview = previews.find(p => p.module === cameraModule);
        return preview?.channelId || null;
    };

    const handleCameraSelect = (cameraReference: string) => {
        setSelectedCamera(cameraReference);
        setSearchParams({ camera: cameraReference });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="alert alert-error">
                    <span>{error instanceof Error ? error.message : 'Failed to load system'}</span>
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

    const selectedCameraPreview = previews.find(p => p.module === selectedCamera);
    const recordingModule = getRecordingModule();
    const recordingAddress = getRecordingModuleAddress();

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
                    {previews.length > 0 && recordingModule && recordingAddress && (
                        <>
                            <div className="flex flex-col lg:flex-row gap-6">
                                {selectedCamera && (
                                    <div className="flex-1 min-w-0">
                                        <StreamPlayer
                                            systemId={system.id}
                                            recordingModuleIp={recordingAddress}
                                            channelId={getChannelForCamera(selectedCamera)}
                                        />
                                    </div>
                                )}

                                {selectedCamera && (
                                    <div className="lg:w-[420px] flex-shrink-0">
                                        <div className="card bg-base-200">
                                            <div className="card-body">
                                                <PTZControls
                                                    systemId={system.id}
                                                    cameraModule={recordingModule.id}
                                                    moduleInfo={recordingModule}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {previews.length > 1 && (
                                <CameraSelector
                                    cameraPreviews={previews}
                                    selectedCamera={selectedCamera}
                                    onCameraSelect={handleCameraSelect}
                                />
                            )}
                        </>
                    )}

                    {previews.length === 0 && (
                        <div className="alert alert-info">
                            <span>No active camera feeds available for this system</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}