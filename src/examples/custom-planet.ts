import { WorldSimulator } from '../WorldSimulator';

console.log('=== Custom Planet Example ===\n');
console.log('Creating a Mars-like planet...\n');

const marsSimulator = new WorldSimulator({
  parameters: {
    radius: 3389500,
    solarConstant: 590,
    orbitalTilt: 25.2,
    rotationPeriod: 24.6,
    seaLevel: 0.3,
    atmosphereDensity: 0.01,
    gridResolution: 3,
  },
  noiseConfig: {
    octaves: 8,
    persistence: 0.6,
    lacunarity: 2.2,
    scale: 1.2,
    redistributionPower: 1.8,
    seed: 'mars-seed-42',
  },
});

console.log('Generating Mars-like world...\n');
marsSimulator.generateWorld();

const marsStats = marsSimulator.getStatistics();
console.log('\n=== Mars-like Planet Statistics ===');
console.log(`Total cells: ${marsStats.totalCells}`);
console.log(`Average temperature: ${marsStats.averageTemperature.toFixed(1)}°C`);
console.log(`Average precipitation: ${marsStats.averagePrecipitation.toFixed(0)} mm/year`);

console.log('\n=== Hot Venus-like Planet ===\n');

const venusSimulator = new WorldSimulator({
  parameters: {
    radius: 6051800,
    solarConstant: 2601,
    orbitalTilt: 177.4,
    rotationPeriod: 2802,
    seaLevel: 0.0,
    atmosphereDensity: 5.0,
    gridResolution: 2,
  },
  noiseConfig: {
    octaves: 5,
    persistence: 0.4,
    lacunarity: 2.0,
    scale: 0.8,
    redistributionPower: 1.5,
    seed: 'venus-seed-99',
  },
});

console.log('Generating Venus-like world...\n');
venusSimulator.generateWorld();

const venusStats = venusSimulator.getStatistics();
console.log('\n=== Venus-like Planet Statistics ===');
console.log(`Total cells: ${venusStats.totalCells}`);
console.log(`Average temperature: ${venusStats.averageTemperature.toFixed(1)}°C`);
console.log(`Average precipitation: ${venusStats.averagePrecipitation.toFixed(0)} mm/year`);

console.log('\n=== Cold Ice Planet ===\n');

const icePlanetSimulator = new WorldSimulator({
  parameters: {
    radius: 5000000,
    solarConstant: 400,
    orbitalTilt: 15.0,
    rotationPeriod: 18,
    seaLevel: 0.7,
    atmosphereDensity: 0.5,
    gridResolution: 2,
  },
  noiseConfig: {
    octaves: 4,
    persistence: 0.3,
    lacunarity: 2.0,
    scale: 1.0,
    redistributionPower: 3.0,
    seed: 'ice-planet-123',
  },
});

console.log('Generating ice planet...\n');
icePlanetSimulator.generateWorld();

const iceStats = icePlanetSimulator.getStatistics();
console.log('\n=== Ice Planet Statistics ===');
console.log(`Total cells: ${iceStats.totalCells}`);
console.log(`Average temperature: ${iceStats.averageTemperature.toFixed(1)}°C`);
console.log(`Average precipitation: ${iceStats.averagePrecipitation.toFixed(0)} mm/year`);

console.log('\n=== Biome Distribution (Ice Planet) ===');
const sortedBiomes = Object.entries(iceStats.biomeDistribution)
  .sort((a, b) => b[1] - a[1]);

for (const [biome, count] of sortedBiomes) {
  const percentage = ((count / iceStats.totalCells) * 100).toFixed(1);
  console.log(`${biome}: ${count} cells (${percentage}%)`);
}
