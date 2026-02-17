import { PlaceModule } from '@placeos/ts-client';

export interface CameraPreview {
    module: string;
    url: string;
    label: string;       // "Professor View", "Learner View"
    channelId: string;   // "2", "4" (used for both preview and streaming)
    cameraModuleReference: string | null; // e.g., "Camera_1", "Camera_2"
}

export interface ChannelCameraMap {
    [channelId: string]: string; // channelId → module reference name e.g. "Camera_1"
}

export interface SystemWithPreviews {
    id: string;
    name: string;
    display_name?: string;
    modules?: readonly string[];
    camera_previews?: CameraPreview[];
    features?: string[];
    zones?: string[];
    [key: string]: any;
}

export interface SystemWithModules extends SystemWithPreviews {
    loadedModules?: PlaceModule[];
}