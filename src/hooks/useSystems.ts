import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Subscription } from 'rxjs';
import type { PlaceModule } from '@placeos/ts-client';
import { bindModuleStatus, getSystemById, getSystemModules, getSystemsPage } from '../services/placeos';
import { generateCameraPreviews, getRecordingAddress, isChannelArray, isChannelCameraMap } from '../utils/cameraUtils';
import type { CameraPreview, ChannelCameraMap } from '../types';

export const useSystems = () => {
    return useQuery({
        queryKey: ['systems'],
        queryFn: async () => {
            const { data } = await getSystemsPage({ limit: 500, offset: 0 });
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useSystem = (id: string | undefined) => {
    return useQuery({
        queryKey: ['system', id],
        queryFn: async () => {
            if (!id) throw new Error('No system ID provided');
            return getSystemById(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useIsRecording = (systemId: string | undefined): boolean => {
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        if (!systemId) return;
        const { observable, unbind } = bindModuleStatus<unknown>(systemId, 'Recording_1', 'active_recordings');
        const sub = observable.subscribe((value) => {
            setIsRecording(Array.isArray(value) && value.length > 0);
        });
        return () => {
            sub.unsubscribe();
            unbind();
        };
    }, [systemId]);

    return isRecording;
};

export const useAutoframe = (systemId: string, cameraModule: string): boolean | null => {
    const [isAutoframe, setIsAutoframe] = useState<boolean | null>(null);

    useEffect(() => {
        const { observable, unbind } = bindModuleStatus<unknown>(systemId, cameraModule, 'autoframe');
        const sub = observable.subscribe((value) => {
            setIsAutoframe(typeof value === 'boolean' ? value : null);
        });
        return () => {
            sub.unsubscribe();
            unbind();
        };
    }, [systemId, cameraModule]);

    return isAutoframe;
};

export const useCameraPreviews = (
    systemId: string | undefined,
    existingModuleIds?: ReadonlyArray<string>
): { data: Array<CameraPreview>; isLoading: boolean; recordingAddress: string | null } => {
    const [previews, setPreviews] = useState<Array<CameraPreview>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [recordingAddress, setRecordingAddress] = useState<string | null>(null);

    useEffect(() => {
        if (!systemId) {
            setIsLoading(false);
            return undefined;
        }

        let cancelled = false;
        let channelsSub: Subscription | null = null;
        let cameraMapSub: Subscription | null = null;
        let channelsUnbind: (() => void) | null = null;
        let cameraMapUnbind: (() => void) | null = null;

        let modules: Array<PlaceModule> = [];
        let currentChannels: Array<{ id: string; name: string }> = [];
        let currentCameraMap: ChannelCameraMap = {};

        const updatePreviews = () => {
            setPreviews(generateCameraPreviews(modules, currentChannels, currentCameraMap));
            setIsLoading(false);
        };

        const init = async () => {
            const moduleIds = existingModuleIds
                ? [...existingModuleIds]
                : await getSystemById(systemId).then(s => [...(s.modules ?? [])]);

            modules = await getSystemModules(moduleIds);
            if (cancelled) return;
            setRecordingAddress(getRecordingAddress(modules));

            const channelsBinding = bindModuleStatus<unknown>(systemId, 'Recording_1', 'channels');
            channelsUnbind = channelsBinding.unbind;
            channelsSub = channelsBinding.observable.subscribe((value) => {
                if (isChannelArray(value)) {
                    currentChannels = value;
                    updatePreviews();
                }
            });

            const cameraMapBinding = bindModuleStatus<unknown>(systemId, 'Recording_1', 'camera_map');
            cameraMapUnbind = cameraMapBinding.unbind;
            cameraMapSub = cameraMapBinding.observable.subscribe((value) => {
                if (isChannelCameraMap(value)) {
                    currentCameraMap = value;
                    updatePreviews();
                }
            });
        };

        void init();

        return () => {
            cancelled = true;
            channelsSub?.unsubscribe();
            cameraMapSub?.unsubscribe();
            channelsUnbind?.();
            cameraMapUnbind?.();
        };
    }, [systemId]);

    return { data: previews, isLoading, recordingAddress };
};
