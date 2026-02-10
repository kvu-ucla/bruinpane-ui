import { PlaceModule } from '@placeos/ts-client';

export interface CameraPreview {
    module: string;
    url: string;
    label: string;       // "Professor View", "Learner View"
    channelId: string;   // "2", "4" (used for both preview and streaming)
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