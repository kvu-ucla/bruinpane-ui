import { querySystems, showModule, showSystem } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { SystemFeature } from '../models';

const hasRecordingFeature = (system: any): boolean => {
  if (!system.features || !Array.isArray(system.features)) {
    console.log("No features array for system:", system.name);
    return false;
  }

  console.log(`Checking system "${system.name}":`, system.features);
  console.log(`Looking for feature:`, SystemFeature.Recording);

  return system.features.some((feature: string) =>
      feature.toLowerCase() === SystemFeature.Recording
  );
};

export const getSystems = async () => {
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

export const getSystemById = async (id: string) => {
  try {
    return await showSystem(id);
  } catch (error) {
    console.error('Failed to fetch system:', error);
    throw error;
  }
};

export const getModuleById = async (id: string) => {
  try {
    return await showModule(id);
  } catch (error) {
    console.error(`Failed to fetch module ${id}:`, error);
    return null;
  }
};

export const getSystemModules = async (moduleIds: string[]) => {
  try {
    const modulePromises = moduleIds.map(id => getModuleById(id));
    const modules = await Promise.all(modulePromises);
    return modules.filter(m => m !== null);
  } catch (error) {
    console.error('Failed to fetch system modules:', error);
    return [];
  }
};