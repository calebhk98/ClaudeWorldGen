import { BiomeType } from '../types';

export class BiomeClassifier {
  private seaLevel: number;

  constructor(seaLevel: number) {
    this.seaLevel = seaLevel;
  }

  classifyBiome(
    temperature: number,
    precipitation: number,
    elevation: number
  ): BiomeType {
    if (elevation < this.seaLevel) {
      return BiomeType.OCEAN;
    }

    if (elevation > this.seaLevel + 4000) {
      return BiomeType.ALPINE;
    }

    if (temperature < -15) {
      return BiomeType.ICE;
    }

    if (temperature < 0) {
      return BiomeType.TUNDRA;
    }

    if (temperature < 10) {
      if (precipitation < 400) {
        return BiomeType.TUNDRA;
      }
      return BiomeType.TAIGA;
    }

    if (temperature < 20) {
      if (precipitation < 250) {
        return BiomeType.TEMPERATE_GRASSLAND;
      }
      if (precipitation < 500) {
        return BiomeType.TEMPERATE_GRASSLAND;
      }
      return BiomeType.TEMPERATE_FOREST;
    }

    if (temperature < 25) {
      if (precipitation < 200) {
        return BiomeType.SUBTROPICAL_DESERT;
      }
      if (precipitation < 500) {
        return BiomeType.TEMPERATE_GRASSLAND;
      }
      if (precipitation < 1000) {
        return BiomeType.TEMPERATE_FOREST;
      }
      return BiomeType.TROPICAL_SEASONAL_FOREST;
    }

    if (precipitation < 250) {
      return BiomeType.DESERT;
    }
    if (precipitation < 500) {
      return BiomeType.SUBTROPICAL_DESERT;
    }
    if (precipitation < 1000) {
      return BiomeType.SAVANNA;
    }
    if (precipitation < 2000) {
      return BiomeType.TROPICAL_SEASONAL_FOREST;
    }

    return BiomeType.TROPICAL_RAINFOREST;
  }

  getBiomeColor(biome: BiomeType): string {
    const colors: Record<BiomeType, string> = {
      [BiomeType.OCEAN]: '#1e3a8a',
      [BiomeType.ICE]: '#f0f9ff',
      [BiomeType.TUNDRA]: '#bae6fd',
      [BiomeType.TAIGA]: '#10b981',
      [BiomeType.TEMPERATE_FOREST]: '#22c55e',
      [BiomeType.TEMPERATE_GRASSLAND]: '#84cc16',
      [BiomeType.DESERT]: '#fbbf24',
      [BiomeType.SAVANNA]: '#bef264',
      [BiomeType.TROPICAL_RAINFOREST]: '#065f46',
      [BiomeType.TROPICAL_SEASONAL_FOREST]: '#16a34a',
      [BiomeType.ALPINE]: '#94a3b8',
      [BiomeType.SUBTROPICAL_DESERT]: '#f59e0b',
    };

    return colors[biome];
  }

  getBiomeDescription(biome: BiomeType): string {
    const descriptions: Record<BiomeType, string> = {
      [BiomeType.OCEAN]: 'Deep water body',
      [BiomeType.ICE]: 'Permanent ice and snow cover',
      [BiomeType.TUNDRA]: 'Cold, treeless plain with permafrost',
      [BiomeType.TAIGA]: 'Boreal coniferous forest',
      [BiomeType.TEMPERATE_FOREST]: 'Deciduous and mixed forest',
      [BiomeType.TEMPERATE_GRASSLAND]: 'Grasslands with moderate rainfall',
      [BiomeType.DESERT]: 'Arid region with minimal precipitation',
      [BiomeType.SAVANNA]: 'Tropical grassland with scattered trees',
      [BiomeType.TROPICAL_RAINFOREST]: 'Dense, wet tropical forest',
      [BiomeType.TROPICAL_SEASONAL_FOREST]: 'Tropical forest with dry season',
      [BiomeType.ALPINE]: 'High mountain terrain',
      [BiomeType.SUBTROPICAL_DESERT]: 'Hot, dry subtropical region',
    };

    return descriptions[biome];
  }
}
