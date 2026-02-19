import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSystemById, getSystemModules, getSystemsPage } from '../services/placeos';
import { generateCameraPreviews } from '../utils/cameraUtils';

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

export const useCameraPreviews = (
    systemId: string | undefined,
    existingModuleIds?: ReadonlyArray<string>
) => {
    return useQuery({
        queryKey: ['cameraPreviews', systemId],
        queryFn: async () => {
            if (!systemId) throw new Error('No system ID');

            const moduleIds = existingModuleIds
                ? [...existingModuleIds]
                : await getSystemById(systemId).then(s => [...(s.modules ?? [])]);

            if (moduleIds.length === 0) return [];

            const modules = await getSystemModules(moduleIds);
            return generateCameraPreviews(systemId, modules);
        },
        enabled: !!systemId,
        staleTime: 5 * 60 * 1000,
    });
};