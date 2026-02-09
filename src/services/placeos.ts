import { querySystems, showSystem, showModule, execute } from '@placeos/ts-client';
import { SystemFeature } from '../models';

const hasRecordingFeature = (system: any): boolean => {
  if (!system.features || !Array.isArray(system.features)) return false;

  return system.features.some((feature: string) =>
    typeof feature === 'string' && feature.toLowerCase() === SystemFeature.Recording
  );
};

export const getSystems = async () => {
  try {
    const response = await querySystems({});

    if (!Array.isArray(response) || response.length === 0) {
      return [];
    }

    const recordingSystems = response.filter(system => hasRecordingFeature(system));
    return recordingSystems;
  } catch (error) {
    console.error('Failed to fetch systems:', error);
    throw error;
  }
};

export const getSystemById = async (id: string) => {
  try {
    const system = await showSystem(id);
    return system;
  } catch (error) {
    console.error('Failed to fetch system:', error);
    throw error;
  }
};

export const getModuleById = async (id: string) => {
  try {
    const module = await showModule(id);
    return module;
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

export const executeCameraCommand = async (
  systemId: string,
  moduleName: string,
  method: string,
  args: any[] = []
) => {
  try {
    const result = await execute({
      sys_id: systemId,
      module: moduleName,
      method,
      args,
    });
    return result;
  } catch (error) {
    console.error(`Camera command failed: ${method}`, error);
    throw error;
  }
};
