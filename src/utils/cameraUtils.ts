import type { PlaceModule } from '@placeos/ts-client';
import type { CameraPreview, ChannelCameraMap } from '../types';

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const isChannelArray = (v: unknown): v is Array<{ id: string; name: string }> =>
    Array.isArray(v) && v.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'name' in item
    );

export const isChannelCameraMap = (v: unknown): v is ChannelCameraMap =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.entries(v).every(([k, val]) => typeof k === 'string' && typeof val === 'string');

export const getRecordingAddress = (modules: Array<PlaceModule>): string | null => {
    const recording = modules.find(m => m.name === 'Recording');
    if (!recording) return null;
    if (recording.ip) return recording.ip;
    if (recording.uri) {
        try {
            return new URL(recording.uri).hostname;
        } catch {
            return null;
        }
    }
    return null;
};

export const resolveCameraModule = (
    channelId: string,
    channelCameraMap: ChannelCameraMap
): string | null => channelCameraMap[channelId] ?? null;

export const generateCameraPreviews = (
    modules: Array<PlaceModule>,
    channels: Array<{ id: string; name: string }>,
    channelCameraMap: ChannelCameraMap
): Array<CameraPreview> => {
    const recordingModules = modules.filter(m => m.name === 'Recording');
    if (recordingModules.length === 0) return [];

    const recording1 = recordingModules[0];
    let address: string | null = null;

    if (recording1.ip) {
        address = recording1.ip;
    } else if (recording1.uri) {
        try {
            address = new URL(recording1.uri).hostname;
        } catch {
            return [];
        }
    }

    if (!address) return [];

    const viewerChannels = channels.filter(ch => ch.name.toLowerCase().includes('view'));

    return viewerChannels.map(channel => ({
        module: 'Recording_1',
        url: `https://${DOMAIN}/epiphan/https/${address}/api/v2.0/channels/${channel.id}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
        label: channel.name,
        channelId: channel.id,
        cameraModuleReference: resolveCameraModule(channel.id, channelCameraMap),
    }));
};
