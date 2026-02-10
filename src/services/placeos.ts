import { querySystems, showModule, showSystem, PlaceSystem, PlaceModule } from '@placeos/ts-client';
import { firstValueFrom } from 'rxjs';
import { SystemFeature } from '../models';


export const getSystems = async (): Promise<PlaceSystem[]> => {
  try {
    const response = await firstValueFrom(querySystems({ 
      limit: 500, 
      features: `${SystemFeature.BruinCast}`}));
    
    console.log("Query systems response: ", response);

    const systemsArray = response?.data || [];

    if (!Array.isArray(systemsArray) || systemsArray.length === 0) {
      return [];
    }
    
    console.log("Filtered systems response: ", systemsArray);
    return systemsArray;
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

export const executeCameraCommand = (module: string, camera: string, method: string, args: any[]) => {
  console.log(`Executing camera ${camera} with ${method}`);
  console.log(`Executing module ${module} with ${args}`);
}