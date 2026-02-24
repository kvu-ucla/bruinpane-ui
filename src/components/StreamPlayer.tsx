import { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';

type PlayerConfig = {
    type: string;
    isLive: boolean;
    url: string;
};

type PlayerOptions = {
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
};

type StreamPlayerProps = {
    systemId: string;
    recordingModuleIp: string;
    channelId: string | null;
};

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const StreamPlayer = ({ systemId, recordingModuleIp, channelId }: StreamPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<mpegts.Player | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('Loading...');
    const [latency, setLatency] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);

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

            // Relaxed latency tolerances reduce rebuffering at the cost of a larger delay;
            // liveBufferLatencyChaseOnStalled is disabled as it causes stuttering on Epiphan streams.
            const playerOptions: PlayerOptions = {
                enableWorker: true,
                enableStashBuffer: true,
                stashInitialSize: 384,
                liveBufferLatencyChasing: true,
                liveBufferLatencyMaxLatency: 3.0,
                liveBufferLatencyMinRemain: 1.0,
                liveBufferLatencyChaseOnStalled: false,
                liveSyncDurationCount: 5,
                fixAudioTimestampGap: true,
                autoCleanupSourceBuffer: true,
                autoCleanupMaxBackwardDuration: 10,
                autoCleanupMinBackwardDuration: 5,
            };

            const player = mpegts.createPlayer(playerConfig, playerOptions);
            playerRef.current = player;
            player.attachMediaElement(video);

            player.on(mpegts.Events.LOADING_COMPLETE, () => {
                setStatus('Stream ready');
                setError(null);
            });

            player.on(mpegts.Events.ERROR, (err: unknown) => {
                console.error('Stream error:', err);
                const errType = err !== null && typeof err === 'object' && 'type' in err
                    ? String((err as { type: unknown }).type)
                    : 'Unknown error';
                setError(`Error: ${errType}`);
            });

            video.addEventListener('waiting', () => {
                setIsBuffering(true);
                setStatus('Buffering...');
            });

            video.addEventListener('playing', () => {
                setIsBuffering(false);
                setStatus('Playing');
            });

            video.addEventListener('canplay', () => {
                setIsBuffering(false);
            });

            player.load();

            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setStatus('Click play to start');
                });
            }
        } else {
            setError('Browser does not support MSE');
        }

        const latencyMonitor = setInterval(() => {
            if (videoRef.current && videoRef.current.buffered.length > 0) {
                const bufferedEnd = videoRef.current.buffered.end(0);
                const currentTime = videoRef.current.currentTime;
                const bufferLength = bufferedEnd - currentTime;

                setLatency(Number(bufferLength.toFixed(2)));

                // Jump only when the buffer grows very large to avoid interrupting normal playback
                if (bufferLength > 5.0 && !videoRef.current.paused) {
                    videoRef.current.currentTime = bufferedEnd - 2.0;
                }
            }
        }, 2000);

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
                    <div className="text-sm space-x-4 flex items-center">
                        <span>Status: {status}</span>
                        <span>Buffer: {latency}s</span>
                        {isBuffering && (
                            <span className="loading loading-spinner loading-sm"></span>
                        )}
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
                        playsInline
                    />
                </div>
            </div>
        </div>
    );
}

