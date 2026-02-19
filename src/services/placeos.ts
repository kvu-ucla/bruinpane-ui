import type { PlaceSystem, PlaceModule } from '@placeos/ts-client';
import type { Observable } from 'rxjs';
import { getModule, querySystems, showModule, showSystem } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { SYSTEM_FEATURE } from '../models';

type SystemsPageParams = {
  limit: number;
  offset: number;
};

export const getSystemsPage = async ({ limit, offset }: SystemsPageParams): Promise<{ data: Array<PlaceSystem>; total: number }> => {
  try {
    const response = await firstValueFrom(querySystems({
      limit,
      offset,
      features: SYSTEM_FEATURE.BruinCast,
    }));
    return {
      data: response?.data ?? [],
      total: response?.total ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch systems page:', error);
    throw error;
  }
};

export const getSystemById = async (id: string): Promise<PlaceSystem> => {
  try {
    return await firstValueFrom(showSystem(id));
  } catch (error) {
    console.error('Failed to fetch system:', error);
    throw error;
  }
};

export const getModuleById = async (id: string): Promise<PlaceModule | null> => {
  try {
    return await firstValueFrom(showModule(id));
  } catch (error) {
    console.error(`Failed to fetch module ${id}:`, error);
    return null;
  }
};

export const getSystemModules = async (moduleIds: Array<string>): Promise<Array<PlaceModule>> => {
  try {
    const modules = await Promise.all(moduleIds.map(id => getModuleById(id)));
    return modules.filter((m): m is PlaceModule => m !== null);
  } catch (error) {
    console.error('Failed to fetch system modules:', error);
    return [];
  }
};

export const bindModuleStatus = <T>(
  systemId: string,
  moduleName: string,
  statusKey: string
): { observable: Observable<T>; unbind: () => void } => {
  const module = getModule(systemId, moduleName);
  const binding = module.binding(statusKey);
  binding.bind();
  return {
    observable: binding.listen() as Observable<T>,
    unbind: () => binding.unbind(),
  };
};

export const executePTZCommand = async (
  systemId: string,
  moduleRef: string,
  method: string,
  args: Array<unknown> = []
): Promise<void> => {
  const module = getModule(systemId, moduleRef);
  if (!module) return;
  await module.execute(method, args);
};
