export interface CameraPreview {
    module: string;
    url: string;
    label: string;
}

export interface SystemWithPreviews {
    id: string;
    name: string;
    modules?: readonly string[];
    camera_previews?: CameraPreview[];
    [key: string]: any;
}