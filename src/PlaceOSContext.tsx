import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PlaceModule, PlaceSystem } from '@placeos/ts-client';
import { getModule, querySystems, showModule } from '@placeos/ts-client';
import type { Observable, Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { generateCameraPreviews, getRecordingAddress, isChannelArray, isChannelCameraMap } from './utils/cameraUtils';
import type { CameraPreview, ChannelCameraMap } from './types';
import { SYSTEM_FEATURE } from './models';

type SystemCameraState = {
    previews: CameraPreview[];
    recordingAddress: string | null;
    isLoading: boolean;
};

type AutoframeBinding = {
    sub: Subscription;
    unbind: () => void;
    count: number;
};

type PlaceOSContextValue = {
    systems: PlaceSystem[];
    systemsLoading: boolean;
    systemsError: Error | null;
    recordingStates: Record<string, boolean>;
    cameraStates: Record<string, SystemCameraState>;
    autoframeStates: Record<string, Record<string, boolean | null>>;
    executePTZCommand: (systemId: string, moduleRef: string, method: string, args?: unknown[]) => Promise<void>;
    registerAutoframe: (systemId: string, cameraModule: string) => void;
    unregisterAutoframe: (systemId: string, cameraModule: string) => void;
};

export const SYSTEMS_QUERY_LIMIT = 500;

export const PlaceOSContext = createContext<PlaceOSContextValue | null>(null);

const bindStatus = <TValue,>(
    systemId: string,
    moduleName: string,
    statusKey: string
): { observable: Observable<TValue>; unbind: () => void } => {
    const mod = getModule(systemId, moduleName);
    const binding = mod.binding(statusKey);
    binding.bind();
    return { observable: binding.listen() as Observable<TValue>, unbind: () => binding.unbind() };
};

export const PlaceOSProvider = ({ children }: { children: ReactNode }) => {
    const [systems, setSystems] = useState<PlaceSystem[]>([]);
    const [systemsLoading, setSystemsLoading] = useState(true);
    const [systemsError, setSystemsError] = useState<Error | null>(null);
    const [recordingStates, setRecordingStates] = useState<Record<string, boolean>>({});
    const [cameraStates, setCameraStates] = useState<Record<string, SystemCameraState>>({});
    const [autoframeStates, setAutoframeStates] = useState<Record<string, Record<string, boolean | null>>>({});

    const bindingsRef = useRef<Map<string, { subs: Subscription[]; unbinds: Array<() => void> }>>(new Map());
    const autoframeRef = useRef<Map<string, AutoframeBinding>>(new Map());

    useEffect(() => {
        let cancelled = false;

        const initSystem = async (system: PlaceSystem) => {
            const recBinding = bindStatus<unknown>(system.id, 'Recording_1', 'active_recordings');
            const recSub = recBinding.observable.subscribe(value => {
                setRecordingStates(prev => ({ ...prev, [system.id]: Array.isArray(value) && value.length > 0 }));
            });

            setCameraStates(prev => ({
                ...prev,
                [system.id]: { previews: [], recordingAddress: null, isLoading: true },
            }));

            const moduleIds = [...(system.modules ?? [])];
            const moduleResults = await Promise.all(
                moduleIds.map(id => firstValueFrom(showModule(id)).catch(() => null))
            );
            if (cancelled) return;

            const modules = moduleResults.filter((m): m is PlaceModule => m !== null);
            const recAddress = getRecordingAddress(modules);
            const hasRecording = modules.some(m => m.name === 'Recording');

            if (!hasRecording) {
                setCameraStates(prev => ({
                    ...prev,
                    [system.id]: { previews: [], recordingAddress: null, isLoading: false },
                }));
                bindingsRef.current.set(system.id, { subs: [recSub], unbinds: [recBinding.unbind] });
                return;
            }

            let currentChannels: Array<{ id: string; name: string }> = [];
            let currentCameraMap: ChannelCameraMap = {};

            const updateCameraState = () => {
                setCameraStates(prev => ({
                    ...prev,
                    [system.id]: {
                        previews: generateCameraPreviews(modules, currentChannels, currentCameraMap),
                        recordingAddress: recAddress,
                        isLoading: false,
                    },
                }));
            };

            const channelsBinding = bindStatus<unknown>(system.id, 'Recording_1', 'channels');
            const channelsSub = channelsBinding.observable.subscribe(value => {
                if (isChannelArray(value)) { currentChannels = value; updateCameraState(); }
            });

            const cameraMapBinding = bindStatus<unknown>(system.id, 'Recording_1', 'camera_map');
            const cameraMapSub = cameraMapBinding.observable.subscribe(value => {
                if (isChannelCameraMap(value)) { currentCameraMap = value; updateCameraState(); }
            });

            bindingsRef.current.set(system.id, {
                subs: [recSub, channelsSub, cameraMapSub],
                unbinds: [recBinding.unbind, channelsBinding.unbind, cameraMapBinding.unbind],
            });
        };

        const init = async () => {
            try {
                const response = await firstValueFrom(querySystems({
                    limit: SYSTEMS_QUERY_LIMIT,
                    features: SYSTEM_FEATURE.BruinCast,
                }));
                if (cancelled) return;
                const systemList = response?.data ?? [];
                setSystems(systemList);
                setSystemsLoading(false);
                await Promise.all(systemList.map(initSystem));
            } catch (error) {
                console.error('[PlaceOSContext] Failed to initialize:', error);
                setSystemsError(error instanceof Error ? error : new Error('Failed to load systems'));
                setSystemsLoading(false);
            }
        };

        void init();

        const bindings = bindingsRef.current;
        const autoframe = autoframeRef.current;

        return () => {
            cancelled = true;
            bindings.forEach(({ subs, unbinds }) => {
                subs.forEach(s => s.unsubscribe());
                unbinds.forEach(u => u());
            });
            bindings.clear();
            autoframe.forEach(({ sub, unbind }) => {
                sub.unsubscribe();
                unbind();
            });
            autoframe.clear();
        };
    }, []);

    const registerAutoframe = useCallback((systemId: string, cameraModule: string) => {
        const key = `${systemId}:${cameraModule}`;
        const existing = autoframeRef.current.get(key);
        if (existing) {
            existing.count++;
            return;
        }
        const { observable, unbind } = bindStatus<unknown>(systemId, cameraModule, 'autoframe');
        const sub = observable.subscribe(value => {
            setAutoframeStates(prev => ({
                ...prev,
                [systemId]: { ...(prev[systemId] ?? {}), [cameraModule]: typeof value === 'boolean' ? value : null },
            }));
        });
        autoframeRef.current.set(key, { sub, unbind, count: 1 });
    }, []);

    const unregisterAutoframe = useCallback((systemId: string, cameraModule: string) => {
        const key = `${systemId}:${cameraModule}`;
        const existing = autoframeRef.current.get(key);
        if (!existing) return;
        existing.count--;
        if (existing.count === 0) {
            existing.sub.unsubscribe();
            existing.unbind();
            autoframeRef.current.delete(key);
            setAutoframeStates(prev => {
                const next = { ...prev };
                if (next[systemId]) {
                    const moduleStates = { ...next[systemId] };
                    delete moduleStates[cameraModule];
                    next[systemId] = moduleStates;
                }
                return next;
            });
        }
    }, []);

    const executePTZCommand = useCallback(async (
        systemId: string,
        moduleRef: string,
        method: string,
        args: unknown[] = []
    ): Promise<void> => {
        const mod = getModule(systemId, moduleRef);
        if (!mod) return;
        await mod.execute(method, args);
    }, []);

    return (
        <PlaceOSContext.Provider value={{
            systems,
            systemsLoading,
            systemsError,
            recordingStates,
            cameraStates,
            autoframeStates,
            executePTZCommand,
            registerAutoframe,
            unregisterAutoframe,
        }}>
            {children}
        </PlaceOSContext.Provider>
    );
};

