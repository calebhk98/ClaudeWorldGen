import { WorldSimulator } from '../WorldSimulator';

console.log('=== Basic World Simulator Example ===\n');

const simulator = new WorldSimulator({
  parameters: {
    radius: 6371000,
    solarConstant: 1361,
    orbitalTilt: 23.5,
    rotationPeriod: 24,
    seaLevel: 0.5,
    atmosphereDensity: 1.0,
    gridResolution: 3,
  },
  noiseConfig: {
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 1.0,
    redistributionPower: 2.0,
  },
});

console.log('Generating world...\n');
simulator.generateWorld();

console.log('\n=== World Statistics ===');
const stats = simulator.getStatistics();
console.log(`Total cells: ${stats.totalCells}`);
console.log(`Land cells: ${stats.landCells} (${((stats.landCells / stats.totalCells) * 100).toFixed(1)}%)`);
console.log(`Ocean cells: ${stats.oceanCells} (${((stats.oceanCells / stats.totalCells) * 100).toFixed(1)}%)`);
console.log(`Average temperature: ${stats.averageTemperature.toFixed(1)}°C`);
console.log(`Average precipitation: ${stats.averagePrecipitation.toFixed(0)} mm/year`);

console.log('\n=== Biome Distribution ===');
const sortedBiomes = Object.entries(stats.biomeDistribution)
  .sort((a, b) => b[1] - a[1]);

for (const [biome, count] of sortedBiomes) {
  const percentage = ((count / stats.totalCells) * 100).toFixed(1);
  console.log(`${biome}: ${count} cells (${percentage}%)`);
}

console.log('\n=== Sample Locations ===');
const sampleLocations = [
  { name: 'North Pole', lat: 90, lng: 0 },
  { name: 'Equator', lat: 0, lng: 0 },
  { name: 'South Pole', lat: -90, lng: 0 },
  { name: 'Mid-latitude North', lat: 45, lng: 0 },
  { name: 'Mid-latitude South', lat: -45, lng: 0 },
];

for (const location of sampleLocations) {
  const cell = simulator.getCellAtLatLng(location.lat, location.lng);
  if (cell) {
    console.log(`\n${location.name} (${location.lat}°, ${location.lng}°):`);
    console.log(`  Elevation: ${(cell.elevation * 10000).toFixed(0)} m`);
    console.log(`  Temperature: ${cell.temperature.toFixed(1)}°C`);
    console.log(`  Precipitation: ${cell.precipitation.toFixed(0)} mm/year`);
    console.log(`  Biome: ${cell.biome}`);
  }
}

console.log('\n=== Export Options ===');
console.log('To export as GeoJSON:');
console.log('  const geojson = simulator.exportToGeoJSON();');
console.log('  fs.writeFileSync("world.geojson", JSON.stringify(geojson));');
