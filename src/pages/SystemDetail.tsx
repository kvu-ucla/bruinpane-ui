import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { PlaceModule } from '@placeos/ts-client';
import { useSystem, useCameraPreviews } from '../hooks/useSystems';
import { StreamPlayer } from '../components/StreamPlayer';
import { PTZControls } from '../components/PTZControls';
import { CameraSelector } from '../components/CameraSelector';
import type { CameraPreview } from '../types';

export const SystemDetail = () => {
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
                                {selectedPreview.cameraModuleReference && (
                                    <span className="ml-2 badge badge-primary badge-sm">
                                        {selectedPreview.cameraModuleReference}
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

                                {/* PTZ Controls */}
                                {selectedPreview && (
                                    <div className="lg:w-[420px] flex-shrink-0">
                                        <div className="card bg-base-200">
                                            <div className="card-body">
                                                {selectedPreview.cameraModuleReference ? (
                                                    <PTZControls
                                                        systemId={system.id}
                                                        cameraModule={selectedPreview.cameraModuleReference}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full min-h-32 text-sm text-base-content/50 text-center">
                                                        There are no camera controls for this feed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Selector */}
                            <CameraSelector
                                cameraPreviews={previews}
                                selectedCamera={selectedChannelId}
                                onCameraSelect={handleCameraSelect}
                            />
                        </>
                    )}

                    {/* No cameras available */}
                    {previews.length === 0 && (
                        <div className="alert alert-info">
                            <span>No active camera feeds available for this system</span>
                        </div>
                    )}


                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title">CPU Load</h2>
                            <iframe
                                src={`https://placeos-prod.avit.it.ucla.edu/analytics/d-solo/56ce376b-7f8a-409e-bff6-8d2da8155b1a/epiphan-analytics?orgId=1&from=now-24h&to=now&timezone=browser&var-sysid=${id}&panelId=1&title=&theme=light&__feature.dashboardSceneSolo=true&refresh=5m`}
                                className="w-full h-96 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
 
        </div>
    );
}