import {querySystems, showModule, showSystem} from '@placeos/ts-client';
import {SystemFeature} from '../models';

const hasRecordingFeature = (system: any): boolean => {
  if (!system.features || !Array.isArray(system.features)) return false;

  return system.features.some((feature: string) =>
    feature.toLowerCase() === SystemFeature.Recording
  );
};

export const getSystems = async () => {
  try {
    const response = querySystems({ limit: 500 });

    if (!Array.isArray(response) || response.length === 0) {
      return [];
    }

    return response.filter(system => hasRecordingFeature(system));
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

