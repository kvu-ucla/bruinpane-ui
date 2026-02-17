import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PlaceModule } from '@placeos/ts-client';
import { useSystem, useCameraPreviews } from '../hooks/useSystems';
import StreamPlayer from '../components/StreamPlayer';
import PTZControls from '../components/PTZControls';
import CameraSelector from '../components/CameraSelector';
import { CameraPreview } from '../types';

export default function SystemDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const { data: system, isLoading, isError, error } = useSystem(id);
    const { data: cameraPreviews } = useCameraPreviews(id);

    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

    const modules = system?.loadedModules || [];
    const previews = cameraPreviews || [];

    // Set initial selected channel from URL or first preview
    useEffect(() => {
        if (previews.length > 0) {
            const channelParam = searchParams.get('channel');
            if (channelParam) {
                setSelectedChannelId(channelParam);
            } else {
                setSelectedChannelId(previews[0].channelId);
            }
        }
    }, [previews, searchParams]);

    const getRecordingModule = (): PlaceModule | undefined => {
        return modules.filter(m => m.name === 'Recording')[0];
    };

    const getRecordingModuleAddress = (): string | null => {
        const recordingModule = getRecordingModule();
        if (!recordingModule) return null;

        if (recordingModule.ip) return recordingModule.ip;

        if (recordingModule.uri) {
            try {
                return new URL(recordingModule.uri).hostname;
            } catch {
                return null;
            }
        }

        return null;
    };

    const getSelectedPreview = (): CameraPreview | undefined => {
        return previews.find(p => p.channelId === selectedChannelId);
    };

    // Resolve camera module for PTZ using reference name e.g. "Camera_1"
    const getActiveCameraModule = (): PlaceModule | undefined => {
        const preview = getSelectedPreview();

        if (!preview?.cameraModuleReference) {
            console.log(`[SystemDetail] No camera module mapped for channel: ${selectedChannelId}`);
            return undefined;
        }

        // Parse reference name into name and index
        // "Camera_1" → name: "Camera", index: 1
        const match = preview.cameraModuleReference.match(/^(.+?)_(\d+)$/);

        if (!match) {
            console.warn(`[SystemDetail] Invalid camera reference format: ${preview.cameraModuleReference}`);
            return undefined;
        }

        const [, moduleName, moduleIndex] = match;

        // Find module by name and index (1-indexed)
        const cameraModules = modules.filter(m => m.name === moduleName);
        const cameraModule = cameraModules[parseInt(moduleIndex) - 1];

        if (!cameraModule) {
            console.warn(`[SystemDetail] Camera module not found: ${preview.cameraModuleReference}`);
            return undefined;
        }

        console.log(`[SystemDetail] ✅ Active camera module for channel ${selectedChannelId}: ${cameraModule.custom_name || cameraModule.name}`);
        return cameraModule;
    };

    const handleCameraSelect = (channelId: string) => {
        console.log(`[SystemDetail] Selected channel: ${channelId}`);
        setSelectedChannelId(channelId);
        setSearchParams({ channel: channelId });
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

    const selectedPreview = getSelectedPreview();
    const activeCameraModule = getActiveCameraModule();
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
                        {selectedPreview && (
                            <p className="text-sm text-base-content/60 mt-1">
                                Viewing: {selectedPreview.label}
                                {activeCameraModule && (
                                    <span className="ml-2 badge badge-primary badge-sm">
                                        {activeCameraModule.custom_name || activeCameraModule.name}
                                    </span>
                                )}
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
                                {/* Stream Player */}
                                {selectedChannelId && (
                                    <div className="flex-1 min-w-0">
                                        <StreamPlayer
                                            systemId={system.id}
                                            recordingModuleIp={recordingAddress}
                                            channelId={selectedChannelId}
                                        />
                                    </div>
                                )}

                                {/* PTZ Controls - only shown if channel has a mapped camera module */}
                                {activeCameraModule && (
                                    <div className="lg:w-[420px] flex-shrink-0">
                                        <div className="card bg-base-200">
                                            <div className="card-body">
                                                <PTZControls
                                                    systemId={system.id}
                                                    cameraModule={activeCameraModule.id}
                                                    moduleInfo={activeCameraModule}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Selector */}
                            {previews.length > 1 && (
                                <CameraSelector
                                    cameraPreviews={previews}
                                    selectedCamera={selectedChannelId}
                                    onCameraSelect={handleCameraSelect}
                                />
                            )}
                        </>
                    )}

                    {/* No cameras available */}
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