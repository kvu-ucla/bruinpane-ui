import { getModule, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { CameraPreview } from '../types';

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const getActiveNDIInputs = async (systemId: string, moduleReferenceName: string): Promise<number[]> => {
    try {
        console.log(`[getActiveNDIInputs] Starting for system: ${systemId}, module: ${moduleReferenceName}`);
        const module = getModule(systemId, moduleReferenceName);
        const activeInputs: number[] = [];

        for (let i = 1; i <= 6; i++) {
            const statusKey = `NDI${i}_video_status`;
            try {
                const value = await firstValueFrom(module.variable(statusKey).listen());
                console.log(`[getActiveNDIInputs] ${statusKey} = ${value}`);

                if (value === true) {
                    activeInputs.push(i);
                    console.log(`[getActiveNDIInputs] ✅ Added NDI${i} to active inputs`);
                }
            } catch (err) {
                console.log(`[getActiveNDIInputs] ⚠️ ${statusKey} does not exist or failed to fetch`);
                // Continue checking other inputs even if this one doesn't exist
            }
        }

        console.log(`[getActiveNDIInputs] Final active inputs:`, activeInputs);
        return activeInputs.sort((a, b) => a - b);
    } catch (err) {
        console.error(`[getActiveNDIInputs] ERROR:`, err);
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

        // Get active NDI inputs
        console.log(`[generateCameraPreviews] Fetching active NDI inputs...`);
        const activeInputs = await getActiveNDIInputs(systemId, recording1.referenceName);
        console.log(`[generateCameraPreviews] Active NDI inputs:`, activeInputs);

        if (activeInputs.length === 0) {
            console.log(`[generateCameraPreviews] ⚠️ No active NDI inputs found`);
            return [];
        }

        // Generate preview URLs
        const previews = activeInputs.map(input => {
            const preview = {
                module: recording1.referenceName,
                url: `https://${DOMAIN}/epiphan/https/${address}/api/v2.0/inputs/NDI${input}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
                label: `Recording - NDI${input}`
            };
            console.log(`[generateCameraPreviews] Generated preview for NDI${input}:`, preview.url);
            return preview;
        });

        console.log(`[generateCameraPreviews] ✅ Total previews generated:`, previews.length);
        return previews;
    } catch (err) {
        console.error(`[generateCameraPreviews] ERROR:`, err);
        return [];
    }
};