export interface WorldParameters {
  radius: number;
  solarConstant: number;
  orbitalTilt: number;
  rotationPeriod: number;
  seaLevel: number;
  atmosphereDensity: number;
  gridResolution: number;
}

export interface CellData {
  cellId: string;
  latitude: number;
  longitude: number;
  elevation: number;
  temperature: number;
  precipitation: number;
  biome: BiomeType;
  isOcean: boolean;
}

export enum BiomeType {
  OCEAN = 'Ocean',
  ICE = 'Ice',
  TUNDRA = 'Tundra',
  TAIGA = 'Taiga',
  TEMPERATE_FOREST = 'Temperate Forest',
  TEMPERATE_GRASSLAND = 'Temperate Grassland',
  DESERT = 'Desert',
  SAVANNA = 'Savanna',
  TROPICAL_RAINFOREST = 'Tropical Rainforest',
  TROPICAL_SEASONAL_FOREST = 'Tropical Seasonal Forest',
  ALPINE = 'Alpine',
  SUBTROPICAL_DESERT = 'Subtropical Desert',
}

export interface ClimateData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

export interface HeightMapData {
  width: number;
  height: number;
  data: Float32Array;
  min: number;
  max: number;
}
