import { useContext, useEffect } from 'react';
import { PlaceOSContext } from '../PlaceOSContext';

const usePlaceOS = () => {
    const ctx = useContext(PlaceOSContext);
    if (!ctx) throw new Error('usePlaceOS must be used within PlaceOSProvider');
    return ctx;
};

export const usePlaceOSSystems = () => {
    const { systems, systemsLoading, systemsError } = usePlaceOS();
    return { data: systems, isLoading: systemsLoading, isError: !!systemsError, error: systemsError };
};

export const useRecordingState = (systemId: string | undefined): boolean => {
    const { recordingStates } = usePlaceOS();
    return systemId ? (recordingStates[systemId] ?? false) : false;
};

export const useAllRecordingStates = (): Record<string, boolean> => {
    const { recordingStates } = usePlaceOS();
    return recordingStates;
};

export const useCameraState = (systemId: string | undefined) => {
    const { cameraStates } = usePlaceOS();
    const state = systemId ? cameraStates[systemId] : undefined;
    return {
        data: state?.previews ?? [],
        isLoading: state?.isLoading ?? true,
        recordingAddress: state?.recordingAddress ?? null,
    };
};

export const useAutoframe = (systemId: string, cameraModule: string): boolean | null => {
    const { autoframeStates, registerAutoframe, unregisterAutoframe } = usePlaceOS();

    useEffect(() => {
        registerAutoframe(systemId, cameraModule);
        return () => unregisterAutoframe(systemId, cameraModule);
    }, [systemId, cameraModule, registerAutoframe, unregisterAutoframe]);

    return autoframeStates[systemId]?.[cameraModule] ?? null;
};

export const usePTZCommand = () => {
    const { executePTZCommand } = usePlaceOS();
    return executePTZCommand;
};
