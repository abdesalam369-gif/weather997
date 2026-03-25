export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  rainfall: number;
  description: string;
  timestamp: number;
}

export type IncidentType = 
  | 'road_closed_total' 
  | 'road_closed_partial' 
  | 'culvert_blocked_total' 
  | 'culvert_blocked_partial' 
  | 'water_accumulation' 
  | 'landslide' 
  | 'manual';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: 'critical' | 'warning' | 'success' | 'normal';
  status: 'pending' | 'in_progress' | 'resolved';
  location: [number, number];
  title: string;
  description: string;
  timestamp: number | string;
}

export interface District {
  name: string;
  center: [number, number];
  boundary?: [number, number][];
}
