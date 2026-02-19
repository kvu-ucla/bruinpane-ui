import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSystemById, getSystemModules, getSystemsPage } from '../services/placeos';
import { generateCameraPreviews } from '../utils/cameraUtils';
import type { SystemWithModules } from '../types';

const PAGE_SIZE = 20;

export const useInfiniteSystems = () => {
    const queryClient = useQueryClient();

    return useInfiniteQuery({
        queryKey: ['systems', 'infinite'],
        queryFn: async ({ pageParam = 0 }) => {
            console.log(`[useInfiniteSystems] Fetching page at offset ${pageParam}`);

            const { data: systemsArray, total } = await getSystemsPage({ limit: PAGE_SIZE, offset: pageParam });

            const systemsWithData = await Promise.all(
                systemsArray.map(async (system): Promise<SystemWithModules> => {
                    if (!system.modules || system.modules.length === 0) {
                        return { ...system, loadedModules: [], camera_previews: [] };
                    }

                    try {
                        const modules = await getSystemModules([...system.modules]);
                        const previews = await generateCameraPreviews(system.id, modules);

                        queryClient.setQueryData(['system', system.id], {
                            ...system,
                            loadedModules: modules,
                            camera_previews: previews.length > 0 ? previews : undefined
                        });
                        queryClient.setQueryData(['cameraPreviews', system.id], previews);

                        return {
                            ...system,
                            loadedModules: modules,
                            camera_previews: previews.length > 0 ? previews : undefined
                        };
                    } catch (err) {
                        console.error(`Failed to load data for system ${system.id}:`, err);
                        return { ...system, loadedModules: [], camera_previews: [] };
                    }
                })
            );

            return {
                systems: systemsWithData,
                nextOffset: pageParam + PAGE_SIZE,
                hasMore: pageParam + PAGE_SIZE < total,
                total,
            };
        },
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.nextOffset : undefined,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSystem = (id: string | undefined) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['system', id],
        queryFn: async () => {
            if (!id) throw new Error('No system ID provided');

            console.log(`[useSystem] Fetching system ${id}`);

            const system = await getSystemById(id);

            if (!system.modules || system.modules.length === 0) {
                return { ...system, loadedModules: [], camera_previews: [] };
            }

            const modules = await getSystemModules([...system.modules]);
            const previews = await generateCameraPreviews(system.id, modules);

            queryClient.setQueryData(['cameraPreviews', id], previews);

            return {
                ...system,
                loadedModules: modules,
                camera_previews: previews.length > 0 ? previews : undefined
            };
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCameraPreviews = (systemId: string | undefined) => {
    return useQuery({
        queryKey: ['cameraPreviews', systemId],
        queryFn: async () => {
            if (!systemId) throw new Error('No system ID');

            console.log(`[useCameraPreviews] Fetching previews for ${systemId}`);

            const system = await getSystemById(systemId);

            if (!system.modules || system.modules.length === 0) {
                return [];
            }

            const modules = await getSystemModules([...system.modules]);
            return generateCameraPreviews(systemId, modules);
        },
        enabled: !!systemId,
        staleTime: 5 * 60 * 1000,
    });
};