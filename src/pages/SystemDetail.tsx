import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSystemById, getSystemModules } from '../services/placeos';
import { PlaceSystem, PlaceModule, getModule } from '@placeos/ts-client';
import { generateCameraPreviews } from '../utils/cameraUtils';
import { firstValueFrom, race, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import StreamPlayer from '../components/StreamPlayer';
import PTZControls from '../components/PTZControls';
import CameraSelector from '../components/CameraSelector';
import { CameraPreview } from '../types';

interface LocationState {
    system?: PlaceSystem;
    modules?: PlaceModule[];
    cameraPreviews?: CameraPreview[];
}

interface CameraChannelMapping {
    cameraModule: string;
    ndiInput: number;
    channelId: string | null;
    channelName: string | null;
}

export default function SystemDetail() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [searchParams, setSearchParams] = useSearchParams();

    const [system, setSystem] = useState<PlaceSystem | null>(locationState?.system || null);
    const [modules, setModules] = useState<PlaceModule[]>(locationState?.modules || []);
    const [cameraPreviews, setCameraPreviews] = useState<CameraPreview[]>(locationState?.cameraPreviews || []);
    const [channelMappings, setChannelMappings] = useState<CameraChannelMapping[]>([]);
    const [loading, setLoading] = useState(!locationState?.system);
    const [error, setError] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

    useEffect(() => {
        if (id && !locationState?.system) {
            void loadSystem(id);
        }
    }, [id, locationState]);

    useEffect(() => {
        if (system && modules.length > 0 && cameraPreviews.length === 0) {
            void loadCameraPreviews();
        }
    }, [system, modules, cameraPreviews.length]);

    useEffect(() => {
        if (cameraPreviews.length > 0) {
            const cameraParam = searchParams.get('camera');
            if (cameraParam) {
                setSelectedCamera(cameraParam);
            } else {
                setSelectedCamera(cameraPreviews[0].module);
            }
        }
    }, [cameraPreviews, searchParams]);

    useEffect(() => {
        if (cameraPreviews.length > 0 && getRecordingModule()) {
            void fetchChannelMappings();
        }
    }, [cameraPreviews, modules]);

    const fetchChannelMappings = async () => {
        if (!system) return;

        try {
            const module = getModule(system.id, 'Recording_1');
            const binding = module.binding('channels');
            binding.bind();

            const channelsData = await firstValueFrom(
                race(
                    binding.listen().pipe(
                        filter((v) => Array.isArray(v))
                    ),
                    timer(3000).pipe(map(() => []))
                )
            );

            const channels = channelsData as { id: string; name: string }[];

            // Filter channels with "View" in the name
            const viewChannels = channels.filter(ch =>
                ch.name.toLowerCase().includes('view')
            );

            console.log('[fetchChannelMappings] View channels:', viewChannels);

            // Map camera previews to channels sequentially
            const mappings: CameraChannelMapping[] = cameraPreviews.map((preview, idx) => {
                const channel = viewChannels[idx] || null;

                return {
                    cameraModule: preview.module,
                    ndiInput: idx + 1,
                    channelId: channel?.id || null,
                    channelName: channel?.name || null
                };
            });

            console.log('[fetchChannelMappings] Mappings:', mappings);
            setChannelMappings(mappings);
        } catch (err) {
            console.error('Failed to fetch channel mappings:', err);
        }
    };

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
        const mapping = channelMappings.find(m => m.cameraModule === cameraModule);
        return mapping?.channelId || null;
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
                    {cameraPreviews.length > 0 && recordingModule && recordingAddress && (
                        <>
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Stream Player - takes remaining space */}
                                {selectedCamera && (
                                    <div className="flex-1 min-w-0">
                                        <StreamPlayer
                                            systemId={system.id}
                                            recordingModuleIp={recordingAddress}
                                            channelId={getChannelForCamera(selectedCamera)}
                                        />
                                    </div>
                                )}

                                {/* PTZ Controls - fixed width on large screens */}
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

                            {/* Camera Selector */}
                            {cameraPreviews.length > 1 && (
                                <CameraSelector
                                    cameraPreviews={cameraPreviews}
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