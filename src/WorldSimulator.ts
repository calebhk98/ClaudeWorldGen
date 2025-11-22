import { GridSystem } from './grid/GridSystem';
import { HeightMapGenerator, NoiseConfig } from './terrain/HeightMapGenerator';
import { ClimateSimulator } from './climate/ClimateSimulator';
import { BiomeClassifier } from './biome/BiomeClassifier';
import { WorldParameters, CellData, HeightMapData } from './types';

export interface WorldSimulatorConfig {
  parameters?: Partial<WorldParameters>;
  noiseConfig?: NoiseConfig;
  gridResolution?: number;
  externalHeightMap?: HeightMapData;
}

export class WorldSimulator {
  private params: WorldParameters;
  private grid: GridSystem;
  private heightMapGenerator: HeightMapGenerator;
  private climateSimulator: ClimateSimulator;
  private biomeClassifier: BiomeClassifier;
  private worldCells: Map<string, CellData>;
  private externalHeightMap?: HeightMapData;

  constructor(config: WorldSimulatorConfig = {}) {
    this.params = this.initializeParameters(config.parameters);
    this.grid = new GridSystem(config.gridResolution ?? this.params.gridResolution);
    this.heightMapGenerator = new HeightMapGenerator(config.noiseConfig);
    this.climateSimulator = new ClimateSimulator(this.params);
    this.biomeClassifier = new BiomeClassifier(this.params.seaLevel);
    this.worldCells = new Map();
    this.externalHeightMap = config.externalHeightMap;
  }

  private initializeParameters(partial: Partial<WorldParameters> = {}): WorldParameters {
    return {
      radius: partial.radius ?? 6371000,
      solarConstant: partial.solarConstant ?? 1361,
      orbitalTilt: partial.orbitalTilt ?? 23.5,
      rotationPeriod: partial.rotationPeriod ?? 24,
      seaLevel: partial.seaLevel ?? 0.5,
      atmosphereDensity: partial.atmosphereDensity ?? 1.0,
      gridResolution: partial.gridResolution ?? 4,
    };
  }

  generateWorld(): void {
    console.log(`Generating world with ${this.grid.getCellCount()} cells...`);
    const cells = this.grid.getAllCells();

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      if (i % 1000 === 0) {
        console.log(`Processing cell ${i + 1}/${cells.length}...`);
      }

      let elevation: number;
      if (this.externalHeightMap) {
        elevation = this.heightMapGenerator.loadFromHeightMap(
          this.externalHeightMap,
          cell.latitude,
          cell.longitude
        );
      } else {
        elevation = this.heightMapGenerator.getElevationAtLatLng(
          cell.latitude,
          cell.longitude
        );
      }

      const isOcean = elevation < this.params.seaLevel;

      const distanceToOcean = isOcean ? 0 : this.estimateDistanceToOcean(cell.cellId, cells);

      const climate = this.climateSimulator.calculateClimate(
        cell.latitude,
        elevation * 10000,
        distanceToOcean
      );

      const biome = this.biomeClassifier.classifyBiome(
        climate.temperature,
        climate.precipitation,
        elevation * 10000
      );

      this.worldCells.set(cell.cellId, {
        cellId: cell.cellId,
        latitude: cell.latitude,
        longitude: cell.longitude,
        elevation,
        temperature: climate.temperature,
        precipitation: climate.precipitation,
        biome,
        isOcean,
      });
    }

    console.log('World generation complete!');
  }

  private estimateDistanceToOcean(cellId: string, allCells: any[]): number {
    const checkRadius = 5;
    const cell = this.worldCells.get(cellId);

    if (!cell) {
      return 1000;
    }

    let minDistance = Infinity;

    for (const otherCell of allCells) {
      const distance = this.haversineDistance(
        cell.latitude,
        cell.longitude,
        otherCell.latitude,
        otherCell.longitude
      );

      if (distance < checkRadius * 100) {
        const cellData = this.worldCells.get(otherCell.cellId);
        if (cellData && cellData.isOcean) {
          minDistance = Math.min(minDistance, distance);
        }
      }
    }

    return minDistance === Infinity ? 1000 : minDistance;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = this.params.radius / 1000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getCellData(cellId: string): CellData | undefined {
    return this.worldCells.get(cellId);
  }

  getCellAtLatLng(lat: number, lng: number): CellData | undefined {
    const cellId = this.grid.getCellAtLatLng(lat, lng);
    return this.worldCells.get(cellId);
  }

  getAllCells(): CellData[] {
    return Array.from(this.worldCells.values());
  }

  getStatistics(): {
    totalCells: number;
    landCells: number;
    oceanCells: number;
    biomeDistribution: Record<string, number>;
    averageTemperature: number;
    averagePrecipitation: number;
  } {
    const cells = this.getAllCells();
    const biomeDistribution: Record<string, number> = {};
    let totalTemp = 0;
    let totalPrecip = 0;
    let landCells = 0;
    let oceanCells = 0;

    for (const cell of cells) {
      biomeDistribution[cell.biome] = (biomeDistribution[cell.biome] || 0) + 1;
      totalTemp += cell.temperature;
      totalPrecip += cell.precipitation;

      if (cell.isOcean) {
        oceanCells++;
      } else {
        landCells++;
      }
    }

    return {
      totalCells: cells.length,
      landCells,
      oceanCells,
      biomeDistribution,
      averageTemperature: totalTemp / cells.length,
      averagePrecipitation: totalPrecip / cells.length,
    };
  }

  exportToGeoJSON(): any {
    const features = this.getAllCells().map(cell => ({
      type: 'Feature',
      properties: {
        cellId: cell.cellId,
        elevation: cell.elevation,
        temperature: cell.temperature,
        precipitation: cell.precipitation,
        biome: cell.biome,
        isOcean: cell.isOcean,
      },
      geometry: {
        type: 'Point',
        coordinates: [cell.longitude, cell.latitude],
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  getParameters(): WorldParameters {
    return { ...this.params };
  }
}
