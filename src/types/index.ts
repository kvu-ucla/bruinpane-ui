import type { PlaceModule } from '@placeos/ts-client';

export type CameraPreview = {
    module: string;
    url: string;
    /** Display name of the channel, e.g. "Professor View", "Learner View" */
    label: string;
    /** Epiphan channel ID used for both the preview image and live stream URLs */
    channelId: string;
    /** PlaceOS module reference for PTZ control, e.g. "Camera_1"; null if no mapping exists */
    cameraModuleReference: string | null;
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
