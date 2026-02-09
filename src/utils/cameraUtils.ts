import { getModule, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { CameraPreview } from '../types';

const DOMAIN = 'placeos-prod.avit.it.ucla.edu';

export const getActiveNDIInputs = async (systemId: string, moduleId: string): Promise<number[]> => {
    try {
        const module = getModule(systemId, moduleId, 1);
        const activeInputs: number[] = [];

        for (let i = 1; i <= 20; i++) {
            try {
                const statusKey = `NDI${i}_video_status`;
                const value = await firstValueFrom(module.binding(statusKey).listen());

                if (value === true) {
                    activeInputs.push(i);
                }
            } catch (err) {
                if (i > 1 && activeInputs.length === 0) {
                    break;
                }
            }
        }

        return activeInputs.sort((a, b) => a - b);
    } catch (err) {
        console.error(`Failed to get NDI inputs for module ${moduleId}:`, err);
        return [];
    }
};

export const generateCameraPreviews = async (
    systemId: string,
    modules: PlaceModule[]
): Promise<CameraPreview[]> => {
    const recordingModule = modules.find(module => module.id === 'recording_1');

    if (!recordingModule?.ip) {
        return [];
    }

    const activeInputs = await getActiveNDIInputs(systemId, recordingModule.id);

    return activeInputs.map(input => ({
        module: recordingModule.id,
        url: `https://${DOMAIN}/epiphan/https/${recordingModule.ip}/api/v2.0/inputs/NDI${input}/preview?resolution=300x300&keep_aspect_ratio=true&format=jpg`,
        label: `${recordingModule.custom_name || recordingModule.name} - NDI${input}`
    }));
};