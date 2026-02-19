import { getModule, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom, race, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CameraPreview, ChannelCameraMap } from '../types';

const DOMAIN = "placeos-prod.avit.it.ucla.edu";

const bindAndGet = async <T>(
    systemId: string,
    moduleName: string,
    statusKey: string,
    validator: (v: unknown) => boolean,
    fallback: T,
    timeoutMs: number = 3000
): Promise<T> => {
    try {
        console.log(`[bindAndGet] ${moduleName} → ${statusKey}`);
        const module = getModule(systemId, moduleName);
        const binding = module.binding(statusKey);
        binding.bind();

        const value = await firstValueFrom(
            race(
                binding.listen().pipe(filter(validator)),
                timer(timeoutMs).pipe(map(() => fallback))
            )
        );

        console.log(`[bindAndGet] ${statusKey} =`, value);
        return value as T;
    } catch (err) {
        console.error(`[bindAndGet] ERROR ${moduleName} → ${statusKey}:`, err);
        return fallback;
    }
};

const isChannelArray = (v: unknown): v is { id: string; name: string }[] =>
    Array.isArray(v) && v.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'name' in item
    );

const isChannelCameraMap = (v: unknown): v is ChannelCameraMap =>
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.entries(v).every(
        ([k, val]) => typeof k === 'string' && typeof val === 'string'
    );

export const getViewerChannels = async (systemId: string): Promise<{ id: string; name: string }[]> => {
    try {
        console.log(`[getViewerChannels] Starting for system: ${systemId}`);

        const channels = await bindAndGet<{ id: string; name: string }[]>(
            systemId,
            'Recording_1',
            'channels',
            isChannelArray,
            [],
            3000
        );

        const viewerChannels = channels.filter(ch =>
            ch.name.toLowerCase().includes('view')
        );

        console.log(`[getViewerChannels] ✅ Found ${viewerChannels.length} viewer channels:`, viewerChannels);
        return viewerChannels;
    } catch (err) {
        console.error(`[getViewerChannels] ERROR:`, err);
        return [];
    }
};

export const getChannelCameraMap = async (systemId: string): Promise<ChannelCameraMap> => {
    try {
        console.log(`[getChannelCameraMap] Starting for system: ${systemId}`);

        const moduleMap = await bindAndGet<ChannelCameraMap>(
            systemId,
            'Recording_1',
            'camera_map',
            isChannelCameraMap,
            {},
            3000
        );

        console.log(`[getChannelCameraMap] ✅ camera_map binding result:`, moduleMap);
        return moduleMap;
    } catch (err) {
        console.error(`[getChannelCameraMap] ERROR:`, err);
        return {};
    }
};

export const resolveCameraModule = (
    channelId: string,
    channelCameraMap: ChannelCameraMap
): { cameraModuleReference: string | null } => {
    if (channelCameraMap[channelId]) {
        return { cameraModuleReference: channelCameraMap[channelId] };
    }
    return { cameraModuleReference: null };
};

export const generateCameraPreviews = async (
    systemId: string,
    modules: PlaceModule[]
): Promise<CameraPreview[]> => {
    try {
        console.log(`[generateCameraPreviews] Starting for system: ${systemId}`);
        console.log(`[generateCameraPreviews] Total modules:`, modules.length);

        const recordingModules = modules.filter(m => m.name === 'Recording');
        console.log(`[generateCameraPreviews] Found ${recordingModules.length} Recording modules`);

        if (recordingModules.length === 0) {
            console.log(`[generateCameraPreviews] ❌ No Recording modules found`);
            return [];
        }

        const recording1Module = recordingModules[0];
        const recording1 = {
            id: recording1Module.id,
            name: recording1Module.name,
            referenceName: 'Recording_1',
            ip: recording1Module.ip || '',
            uri: recording1Module.uri || ''
        };

        console.log(`[generateCameraPreviews] Recording_1 details:`, recording1);

        let address: string | null = null;
        if (recording1.ip) {
            address = recording1.ip;
            console.log(`[generateCameraPreviews] Using IP: ${address}`);
        } else if (recording1.uri) {
            try {
                address = new URL(recording1.uri).hostname;
                console.log(`[generateCameraPreviews] Extracted IP from URI: ${address}`);
            } catch (err) {
                console.error(`[generateCameraPreviews] Failed to parse URI:`, err);
            }
        }

        if (!address) {
            console.log(`[generateCameraPreviews] ❌ No IP or URI found for Recording_1`);
            return [];
        }

        console.log(`[generateCameraPreviews] Fetching viewer channels and camera map...`);
        const [viewerChannels, channelCameraMap] = await Promise.all([
            getViewerChannels(systemId),
            getChannelCameraMap(systemId)
        ]);

        console.log(`[generateCameraPreviews] Viewer channels:`, viewerChannels);
        console.log(`[generateCameraPreviews] Channel-Camera map:`, channelCameraMap);

        if (viewerChannels.length === 0) {
            console.log(`[generateCameraPreviews] ⚠️ No viewer channels found`);
            return [];
        }

        const previews: CameraPreview[] = viewerChannels.map(channel => {
            const { cameraModuleReference } = resolveCameraModule(
                channel.id,
                channelCameraMap
            );

            const preview: CameraPreview = {
                module: recording1.referenceName,
                url: `https://${DOMAIN}/epiphan/https/${address}/api/v2.0/channels/${channel.id}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
                label: channel.name,
                channelId: channel.id,
                cameraModuleReference
            };

            console.log(`[generateCameraPreviews] Generated preview for ${channel.name} (channel ${channel.id}) → Camera: ${cameraModuleReference || 'None'}`);
            return preview;
        });

        console.log(`[generateCameraPreviews] ✅ Total previews generated:`, previews.length);
        return previews;
    } catch (err) {
        console.error(`[generateCameraPreviews] ERROR:`, err);
        return [];
    }
};