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
            const statusKey = `NDI${i}_video_status`;
            try {
                const value = await firstValueFrom(module.binding(statusKey).listen());
                console.log(`[getActiveNDIInputs] ${statusKey} = ${value}`);

                if (value === true) {
                    activeInputs.push(i);
                    console.log(`[getActiveNDIInputs] ✅ Added NDI${i} to active inputs`);
                }
            } catch (err) {
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

    // Print detailed information about all modules
    console.log(`[generateCameraPreviews] ========== ALL MODULES DETAILS ==========`);
    modules.forEach((module, index) => {
        console.log(`[generateCameraPreviews] Module ${index + 1}:`, {
            id: module.id,
            name: module.name,
            custom_name: module.custom_name,
            ip: module.ip,
            port: module.port,
            driver_id: module.driver_id,
            edge_id: module.edge_id,
            role: module.role,
            connected: module.connected,
            running: module.running,
            tls: module.tls,
            udp: module.udp,
            uri: module.uri,
            notes: module.notes,
            control_system_id: module.control_system_id,
            created_at: module.created_at,
            updated_at: module.updated_at
        });
    });
    console.log(`[generateCameraPreviews] ========================================`);

    const recordingModule = modules.find(module => module.id === 'Recording_1');

    if (!recordingModule) {
        console.log(`[generateCameraPreviews] ❌ No Recording_1 module found`);
        console.log(`[generateCameraPreviews] Available module IDs:`, modules.map(m => m.id));
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