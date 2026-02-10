export enum SystemFeature {
  Recording = 'recording',
  Booking = 'booking',
  AV = 'av',
  Lighting = 'lighting',
  HVAC = 'hvac',
  CameraControl = 'camera_control',
  PTZ = 'ptz',
  Signage = 'signage',
  AccessControl = 'access_control',
  Occupancy = 'occupancy',
  BruinCast = 'bruincast'
}

export interface ModuleData {
  id: string;
  name: string;
  custom_name?: string;
  control_system_id?: string;
  driver_id?: string;
  edge_id?: string;
  ip?: string;
  port?: number;
  role?: number;
  connected?: boolean;
  running?: boolean;
  has_runtime_error?: boolean;
  error_timestamp?: number;
  ignore_connected?: boolean;
  makebreak?: boolean;
  tls?: boolean;
  udp?: boolean;
  uri?: string;
  notes?: string;
  created_at?: number;
  updated_at?: number;
  version?: number;
}

export interface SystemSettings {
  updated_at: number;
  version: number;
  parent_id: string;
  encryption_level: number;
  keys: any[];
}

export interface SystemData {
  id: string;
  name: string;
  updated_at: number;
  version: number;
  settings: SystemSettings[];
  display_name?: string;
  description?: string;
  capacity?: number;
  features?: string[];
  bookable?: boolean;
  public?: boolean;
  installed_ui_devices?: number;
  support_url?: string;
  modules?: string[];
  images?: string[];
  zones?: string[];
  timezone?: string;
  module_list?: any[];
  signage?: boolean;
  playlists?: any[];
  approval?: boolean;
  orientation?: string;
}

export interface System {
  id: string;
  name: string;
  description?: string;
  email?: string;
  capacity?: number;
  features?: string[];
  bookable?: boolean;
  modules?: string[];
}
