import { WorldSimulator } from '../WorldSimulator';
import { HeightMapData } from '../types';
import * as fs from 'fs';

console.log('=== Height Map Import Example ===\n');

function createSampleHeightMap(): HeightMapData {
  const width = 360;
  const height = 180;
  const data = new Float32Array(width * height);

  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    const lat = 90 - (y / height) * 180;

    for (let x = 0; x < width; x++) {
      const lng = (x / width) * 360 - 180;

      let elevation = 0.5;
      elevation += Math.sin((lat * Math.PI) / 180) * 0.1;
      elevation += Math.sin((lng * Math.PI) / 90) * 0.1;
      elevation += Math.random() * 0.1;

      const latFactor = Math.abs(lat) / 90;
      if (latFactor > 0.7) {
        elevation += 0.2;
      }

      const index = y * width + x;
      data[index] = elevation;

      min = Math.min(min, elevation);
      max = Math.max(max, elevation);
    }
  }

  return { width, height, data, min, max };
}

console.log('Creating sample height map...');
const heightMap = createSampleHeightMap();
console.log(`Height map created: ${heightMap.width}x${heightMap.height} pixels`);
console.log(`Elevation range: ${heightMap.min.toFixed(3)} - ${heightMap.max.toFixed(3)}\n`);

console.log('Creating world simulator with imported height map...\n');

const simulator = new WorldSimulator({
  parameters: {
    radius: 6371000,
    solarConstant: 1361,
    orbitalTilt: 23.5,
    rotationPeriod: 24,
    seaLevel: 0.6,
    atmosphereDensity: 1.0,
    gridResolution: 3,
  },
  externalHeightMap: heightMap,
});

console.log('Generating world from height map...\n');
simulator.generateWorld();

const stats = simulator.getStatistics();
console.log('\n=== World Statistics ===');
console.log(`Total cells: ${stats.totalCells}`);
console.log(`Land cells: ${stats.landCells} (${((stats.landCells / stats.totalCells) * 100).toFixed(1)}%)`);
console.log(`Ocean cells: ${stats.oceanCells} (${((stats.oceanCells / stats.totalCells) * 100).toFixed(1)}%)`);

console.log('\n=== How to use NASA height map data ===');
console.log('1. Download NASA SRTM data or similar height map');
console.log('2. Convert to normalized Float32Array (0.0 to 1.0)');
console.log('3. Create HeightMapData object:');
console.log('   const heightMap: HeightMapData = {');
console.log('     width: imageWidth,');
console.log('     height: imageHeight,');
console.log('     data: normalizedFloatArray,');
console.log('     min: 0.0,');
console.log('     max: 1.0');
console.log('   };');
console.log('4. Pass to WorldSimulator via externalHeightMap config');

console.log('\nNOTE: For actual NASA data, you may want to use libraries like:');
console.log('  - sharp (for image processing)');
console.log('  - geotiff (for GeoTIFF files)');
console.log('  - gdal (for various geospatial formats)');
