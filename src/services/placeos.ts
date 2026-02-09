import { querySystems, showModule, showSystem, PlaceSystem, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { SystemFeature } from '../models';

const hasRecordingFeature = (system: PlaceSystem): boolean => {
  if (!system.features || !Array.isArray(system.features)) return false;

  return system.features.some((feature: string) =>
      feature.toLowerCase() === SystemFeature.Recording
  );
};

export const getSystems = async (): Promise<PlaceSystem[]> => {
  try {
    const response = await firstValueFrom(querySystems({ limit: 500 }));
    console.log("Query systems response: ", response);

    const systemsArray = response?.data || [];

    if (!Array.isArray(systemsArray) || systemsArray.length === 0) {
      return [];
    }

    const filtered = systemsArray.filter(system => hasRecordingFeature(system));
    console.log("Filtered systems response: ", filtered);
    return filtered;
  } catch (error) {
    console.error('Failed to fetch systems:', error);
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

export const getSystemModules = async (moduleIds: string[]): Promise<PlaceModule[]> => {
  try {
    const modulePromises = moduleIds.map(id => getModuleById(id));
    const modules = await Promise.all(modulePromises);
    return modules.filter((m): m is PlaceModule => m !== null);
  } catch (error) {
    console.error('Failed to fetch system modules:', error);
    return [];
  }
};