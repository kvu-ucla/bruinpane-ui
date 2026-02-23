import { useQuery } from '@tanstack/react-query';
import { firstValueFrom } from 'rxjs';
import { showSystem } from '@placeos/ts-client';

export const useSystem = (id: string | undefined) => {
    return useQuery({
        queryKey: ['system', id],
        queryFn: async () => {
            if (!id) throw new Error('No system ID provided');
            return firstValueFrom(showSystem(id));
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};
