import { getModule, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { CameraPreview } from '../types';

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const getActiveNDIInputs = async (systemId: string, moduleId: string): Promise<number[]> => {
    try {
        console.log(`[getActiveNDIInputs] Starting for system: ${systemId}, module: ${moduleId}`);
        const module = getModule(systemId, moduleId, 1);
        const activeInputs: number[] = [];

        for (let i = 1; i <= 20; i++) {
            try {
                const statusKey = `NDI${i}_video_status`;
                const value = await firstValueFrom(module.binding(statusKey).listen());
                console.log(`[getActiveNDIInputs] ${statusKey} = ${value}`);

                if (value === true) {
                    activeInputs.push(i);
                    console.log(`[getActiveNDIInputs] ✅ Added NDI${i} to active inputs`);
                }
            } catch (err) {
                const statusKey = `NDI${i}_video_status`;
                console.log(`[getActiveNDIInputs] ❌ Failed to get ${statusKey}:`, err);
                if (i > 1 && activeInputs.length === 0) {
                    console.log(`[getActiveNDIInputs] Stopping early - no inputs found after ${i} attempts`);
                    break;
                }
            }
        }

        console.log(`[getActiveNDIInputs] Final active inputs:`, activeInputs);
        return activeInputs.sort((a, b) => a - b);
    } catch (err) {
        console.error(`[getActiveNDIInputs] ERROR for module ${moduleId}:`, err);
        return [];
    }
};

export const generateCameraPreviews = async (
    systemId: string,
    modules: PlaceModule[]
): Promise<CameraPreview[]> => {
    console.log(`[generateCameraPreviews] Starting for system: ${systemId}`);
    console.log(`[generateCameraPreviews] Total modules:`, modules.length);
    console.log(`[generateCameraPreviews] Module IDs:`, modules.map(m => m.id));

    const recordingModule = modules.find(module => module.id === 'Recording_1');

    if (!recordingModule) {
        console.log(`[generateCameraPreviews] ❌ No Recording_1 module found`);
        return [];
    }

    console.log(`[generateCameraPreviews] ✅ Found Recording_1 module:`, {
        id: recordingModule.id,
        ip: recordingModule.ip,
        name: recordingModule.name,
        custom_name: recordingModule.custom_name
    });

    if (!recordingModule.ip) {
        console.log(`[generateCameraPreviews] ❌ Recording_1 module has no IP`);
        return [];
    }

    console.log(`[generateCameraPreviews] Fetching active NDI inputs...`);
    const activeInputs = await getActiveNDIInputs(systemId, recordingModule.id);
    console.log(`[generateCameraPreviews] Active NDI inputs:`, activeInputs);

    const previews = activeInputs.map(input => {
        const preview = {
            module: recordingModule.id,
            url: `https://${DOMAIN}/epiphan/https/${recordingModule.ip}/api/v2.0/inputs/NDI${input}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
            label: `${recordingModule.custom_name || recordingModule.name} - NDI${input}`
        };
        console.log(`[generateCameraPreviews] Generated preview for NDI${input}:`, preview);
        return preview;
    });

    console.log(`[generateCameraPreviews] ✅ Total previews generated:`, previews.length);
    return previews;
};