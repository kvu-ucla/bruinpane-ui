import type { PlaceModule } from '@placeos/ts-client';

export type CameraPreview = {
    module: string;
    url: string;
    label: string;       // "Professor View", "Learner View"
    channelId: string;   // "2", "4" (used for both preview and streaming)
    cameraModuleReference: string | null; // e.g., "Camera_1", "Camera_2"
};

export type ChannelCameraMap = Record<string, string>;

export type SystemWithPreviews = {
    id: string;
    name: string;
    display_name?: string;
    modules?: ReadonlyArray<string>;
    camera_previews?: Array<CameraPreview>;
    features?: Array<string>;
    zones?: ReadonlyArray<string>;
    [key: string]: unknown;
};

export type SystemWithModules = SystemWithPreviews & {
    loadedModules?: Array<PlaceModule>;
};
