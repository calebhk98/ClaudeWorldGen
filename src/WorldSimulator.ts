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
      orbitalPeriod: partial.orbitalPeriod ?? 365,
      seaLevel: partial.seaLevel ?? 0.5,
      atmosphereDensity: partial.atmosphereDensity ?? 1.0,
      gridResolution: partial.gridResolution ?? 4,
      timeOfDay: partial.timeOfDay ?? 12,
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
        cell.longitude,
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
        windSpeed: 0, // Will be calculated in second pass
        windDirection: 0, // Will be calculated in second pass
      });
    }

    // Second pass: calculate wind based on temperature and pressure gradients
    console.log('Calculating winds...');
    for (const cell of cells) {
      const cellData = this.worldCells.get(cell.cellId);
      if (!cellData) continue;

      const { windSpeed, windDirection } = this.calculateWind(
        cell.cellId,
        cell.latitude,
        cell.longitude,
        cellData.temperature,
        cellData.elevation,
        cells
      );

      cellData.windSpeed = windSpeed;
      cellData.windDirection = windDirection;
    }

    console.log('World generation complete!');
  }

  private calculateWind(
    cellId: string,
    latitude: number,
    longitude: number,
    temperature: number,
    elevation: number,
    allCells: any[]
  ): { windSpeed: number; windDirection: number } {
    // Get neighboring cells to calculate temperature gradient
    const neighbors = allCells.filter(other => {
      const dist = this.haversineDistance(
        latitude,
        longitude,
        other.latitude,
        other.longitude
      );
      return dist > 0 && dist < 500; // Within 500km
    }).slice(0, 8); // Max 8 neighbors

    if (neighbors.length === 0) {
      return { windSpeed: 5, windDirection: 90 };
    }

    // Calculate temperature gradient (pressure gradient)
    let gradientNS = 0; // North-South component
    let gradientEW = 0; // East-West component

    for (const neighbor of neighbors) {
      const neighborData = this.worldCells.get(neighbor.cellId);
      if (!neighborData) continue;

      const tempDiff = temperature - neighborData.temperature;
      const latDiff = latitude - neighbor.latitude;
      const lngDiff = longitude - neighbor.longitude;

      // Pressure gradient is proportional to temperature gradient
      // Wind flows from high pressure (cold) to low pressure (hot)
      gradientNS += tempDiff * Math.sign(latDiff);
      gradientEW += tempDiff * Math.sign(lngDiff);
    }

    gradientNS /= neighbors.length;
    gradientEW /= neighbors.length;

    // Calculate Coriolis effect based on rotation rate
    // Coriolis parameter: f = 2 * Omega * sin(latitude)
    const omega = (2 * Math.PI) / this.params.rotationPeriod; // rad/hour
    const latRad = (latitude * Math.PI) / 180;
    const coriolisParameter = 2 * omega * Math.sin(latRad);

    // For rotating planets, apply Coriolis deflection
    // In Northern hemisphere, deflects to the right; Southern, to the left
    let windEW = gradientEW;
    let windNS = gradientNS;

    if (this.params.rotationPeriod < 1000) { // Only if not tidally locked
      // Apply Coriolis deflection (simplified)
      const coriolisStrength = Math.abs(coriolisParameter) * 100;
      windEW += coriolisStrength * Math.sign(latitude) * windNS;
      windNS -= coriolisStrength * Math.sign(latitude) * windEW * 0.5;
    }

    // Base atmospheric circulation (trade winds, westerlies, etc.)
    const absLat = Math.abs(latitude);
    let baseWindEW = 0;

    if (absLat < 30) {
      // Trade winds: easterly (from east to west)
      baseWindEW = -3;
    } else if (absLat < 60) {
      // Westerlies: westerly (from west to east)
      baseWindEW = 5;
    } else {
      // Polar easterlies: easterly
      baseWindEW = -2;
    }

    // Combine gradient wind with base circulation
    windEW += baseWindEW;

    // Topographic effects: elevation increases wind speed
    const elevationFactor = 1 + Math.max(0, (elevation - this.params.seaLevel) / 10000) * 0.5;

    // Calculate final wind speed and direction
    const windSpeed = Math.sqrt(windEW * windEW + windNS * windNS) * elevationFactor;
    const windDirection = (Math.atan2(windEW, windNS) * 180 / Math.PI + 360) % 360;

    return {
      windSpeed: Math.max(1, Math.min(50, windSpeed)), // Clamp between 1-50 m/s
      windDirection
    };
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
