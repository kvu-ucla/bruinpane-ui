import { getModule, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom, race, timer } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CameraPreview } from '../types';

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const getViewerChannels = async (systemId: string): Promise<{ id: string; name: string }[]> => {
    try {
        console.log(`[getViewerChannels] Starting for system: ${systemId}`);
        const module = getModule(systemId, 'Recording_1');
        const binding = module.binding('channels');
        binding.bind();

        // Wait for channels data
        const value = await firstValueFrom(
            race(
                binding.listen().pipe(
                    filter((v) => Array.isArray(v))
                ),
                timer(3000).pipe(map(() => []))
            )
        );

        console.log(`[getViewerChannels] Channels data:`, value);

        if (!Array.isArray(value)) {
            console.log(`[getViewerChannels] ⚠️ Channels is not an array`);
            return [];
        }

        // Filter channels where name includes "View"
        const viewerChannels = (value as { id: string; name: string }[]).filter(channel =>
            channel.name.toLowerCase().includes('view')
        );

        console.log(`[getViewerChannels] ✅ Found ${viewerChannels.length} viewer channels:`, viewerChannels);
        return viewerChannels;
    } catch (err) {
        console.error(`[getViewerChannels] ERROR:`, err);
        return [];
    }
};

export const generateCameraPreviews = async (
    systemId: string,
    modules: PlaceModule[]
): Promise<CameraPreview[]> => {
    try {
        console.log(`[generateCameraPreviews] Starting for system: ${systemId}`);
        console.log(`[generateCameraPreviews] Total modules:`, modules.length);

        // Find all Recording modules
        const recordingModules = modules.filter(m => m.name === 'Recording');
        console.log(`[generateCameraPreviews] Found ${recordingModules.length} Recording modules`);

        if (recordingModules.length === 0) {
            console.log(`[generateCameraPreviews] ❌ No Recording modules found`);
            return [];
        }

        // Get Recording_1 (first Recording module)
        const recording1Module = recordingModules[0];
        const recording1 = {
            id: recording1Module.id,
            name: recording1Module.name,
            referenceName: 'Recording_1',
            ip: recording1Module.ip || '',
            uri: recording1Module.uri || ''
        };

        console.log(`[generateCameraPreviews] Recording_1 details:`, recording1);

        // Extract IP address from IP or URI
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

        // Get viewer channels
        console.log(`[generateCameraPreviews] Fetching viewer channels...`);
        const viewerChannels = await getViewerChannels(systemId);
        console.log(`[generateCameraPreviews] Viewer channels:`, viewerChannels);

        if (viewerChannels.length === 0) {
            console.log(`[generateCameraPreviews] ⚠️ No viewer channels found`);
            return [];
        }

        // Generate previews using channel IDs for both preview and streaming
        const previews = viewerChannels.map(channel => {
            const preview = {
                module: recording1.referenceName,
                url: `https://${DOMAIN}/epiphan/https/${address}/api/v2.0/channels/${channel.id}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
                label: channel.name, // "Professor View", "Learner View"
                channelId: channel.id // "2", "4" (used for both preview and streaming)
            };

            console.log(`[generateCameraPreviews] Generated preview for ${channel.name} (channel ${channel.id}):`, preview.url);
            return preview;
        });

        console.log(`[generateCameraPreviews] ✅ Total previews generated:`, previews.length);
        return previews;
    } catch (err) {
        console.error(`[generateCameraPreviews] ERROR:`, err);
        return [];
    }
};
