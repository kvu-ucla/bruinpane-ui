import { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';

interface PlayerConfig {
    type: string;
    isLive: boolean;
    url: string;
}

interface PlayerOptions {
    enableWorker: boolean;
    enableStashBuffer: boolean;
    stashInitialSize: number;
    liveBufferLatencyChasing: boolean;
    liveBufferLatencyMaxLatency: number;
    liveBufferLatencyMinRemain: number;
    liveBufferLatencyChaseOnStalled: boolean;
    liveSyncDurationCount: number;
    fixAudioTimestampGap: boolean;
    autoCleanupSourceBuffer: boolean;
    autoCleanupMaxBackwardDuration: number;
    autoCleanupMinBackwardDuration: number;
}

interface StreamPlayerProps {
    systemId: string;
    recordingModuleIp: string;
    channelId: string | null;
}

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

function StreamPlayer({ systemId, recordingModuleIp, channelId }: StreamPlayerProps): JSX.Element {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<mpegts.Player | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Loading...');
    const [latency, setLatency] = useState<number>(0);

    // Initialize video player when channel is provided
    useEffect(() => {
        if (!channelId || !recordingModuleIp) {
            setError('No channel selected');
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        // Destroy existing player
        if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
        }

        if (mpegts.getFeatureList().mseLivePlayback) {
            const streamUrl = `https://${DOMAIN}/epiphan/https/${recordingModuleIp}/streams/${channelId}/ts`;

            const playerConfig: PlayerConfig = {
                type: 'mpegts',
                isLive: true,
                url: streamUrl
            };

            const playerOptions: PlayerOptions = {
                // Core settings
                enableWorker: true,
                enableStashBuffer: false,
                stashInitialSize: 128,

                // Low latency configuration
                liveBufferLatencyChasing: true,
                liveBufferLatencyMaxLatency: 1.0,
                liveBufferLatencyMinRemain: 0.3,
                liveBufferLatencyChaseOnStalled: true,

                // Sync settings
                liveSyncDurationCount: 3,

                // Audio/Video sync
                fixAudioTimestampGap: true,

                // Buffer cleanup
                autoCleanupSourceBuffer: true,
                autoCleanupMaxBackwardDuration: 5,
                autoCleanupMinBackwardDuration: 3
            };

            const player = mpegts.createPlayer(playerConfig, playerOptions);
            playerRef.current = player;
            player.attachMediaElement(video);

            player.on(mpegts.Events.LOADING_COMPLETE, () => {
                setStatus('Stream ready');
                setError(null);
            });

            player.on(mpegts.Events.ERROR, (err: any) => {
                console.error('Stream error:', err);
                setError(`Error: ${err.type || 'Unknown error'}`);
            });

            player.load();

            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    console.log('Autoplay prevented, click play button');
                    setStatus('Click play to start');
                });
            }
        } else {
            setError('Browser does not support MSE');
        }

        // Monitor latency
        const latencyMonitor = setInterval(() => {
            if (videoRef.current && videoRef.current.buffered.length > 0) {
                const bufferedEnd = videoRef.current.buffered.end(0);
                const currentTime = videoRef.current.currentTime;
                const bufferLength = bufferedEnd - currentTime;

                setLatency(Number(bufferLength.toFixed(2)));

                // Jump to reduce latency if buffer grows too large
                if (bufferLength > 2.0 && !videoRef.current.paused) {
                    console.log('Jumping to reduce latency');
                    videoRef.current.currentTime = bufferedEnd - 0.5;
                }
            }
        }, 1000);

        return () => {
            clearInterval(latencyMonitor);
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [channelId, recordingModuleIp, systemId]);

    if (!channelId) {
        return (
            <div className="card bg-base-200">
                <div className="card-body">
                    <div className="alert alert-info">
                        <span>Select a camera to view live stream</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-200">
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title">Live Stream</h2>
                    <div className="text-sm space-x-4">
                        <span>Status: {status}</span>
                        <span>Latency: {latency}s</span>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                <div className="aspect-video bg-base-300 rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        controls
                        muted
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}

export default StreamPlayer;