import { createNoise3D, NoiseFunction3D } from 'simplex-noise';
import { HeightMapData } from '../types';

export interface NoiseConfig {
  seed?: string;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  scale?: number;
  redistributionPower?: number;
}

export class HeightMapGenerator {
  private noise: NoiseFunction3D;
  private config: Required<NoiseConfig>;

  constructor(config: NoiseConfig = {}) {
    const seed = config.seed || Math.random().toString();
    this.noise = createNoise3D(() => this.seedToRandom(seed));

    this.config = {
      seed,
      octaves: config.octaves ?? 6,
      persistence: config.persistence ?? 0.5,
      lacunarity: config.lacunarity ?? 2.0,
      scale: config.scale ?? 1.0,
      redistributionPower: config.redistributionPower ?? 2.0,
    };
  }

  private seedToRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483648;
  }

  private latLngToSphere(lat: number, lng: number, radius: number = 1): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    return [x, y, z];
  }

  private fbm(x: number, y: number, z: number): number {
    let total = 0;
    let frequency = this.config.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.config.octaves; i++) {
      total += this.noise(
        x * frequency,
        y * frequency,
        z * frequency
      ) * amplitude;

      maxValue += amplitude;
      amplitude *= this.config.persistence;
      frequency *= this.config.lacunarity;
    }

    return total / maxValue;
  }

  getElevationAtLatLng(lat: number, lng: number, radius: number = 1): number {
    const [x, y, z] = this.latLngToSphere(lat, lng, radius);
    let value = this.fbm(x, y, z);

    value = (value + 1) / 2;

    value = Math.pow(value, this.config.redistributionPower);

    return value;
  }

  generateHeightMap(width: number, height: number): HeightMapData {
    const data = new Float32Array(width * height);
    let min = Infinity;
    let max = -Infinity;

    for (let y = 0; y < height; y++) {
      const lat = 90 - (y / height) * 180;

      for (let x = 0; x < width; x++) {
        const lng = (x / width) * 360 - 180;
        const elevation = this.getElevationAtLatLng(lat, lng);

        const index = y * width + x;
        data[index] = elevation;

        min = Math.min(min, elevation);
        max = Math.max(max, elevation);
      }
    }

    return { width, height, data, min, max };
  }

  loadFromHeightMap(heightMapData: HeightMapData, lat: number, lng: number): number {
    const { width, height, data } = heightMapData;

    const x = Math.floor(((lng + 180) / 360) * width) % width;
    const y = Math.floor(((90 - lat) / 180) * height) % height;

    const index = y * width + x;
    return data[index];
  }
}
