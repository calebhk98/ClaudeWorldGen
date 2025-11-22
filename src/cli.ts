#!/usr/bin/env node

import * as readline from 'readline';
import { WorldSimulator } from './WorldSimulator';
import { BiomeType } from './types';

interface PresetConfig {
  name: string;
  description: string;
  parameters: any;
  noiseConfig?: any;
}

const PRESETS: Record<string, PresetConfig> = {
  '1': {
    name: 'Earth-like',
    description: 'Standard Earth-like planet with realistic climate',
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
  },
  '2': {
    name: 'Mars-like',
    description: 'Cold, dry planet with thin atmosphere',
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
      seed: 'mars-seed',
    },
  },
  '3': {
    name: 'Venus-like',
    description: 'Hot, thick atmosphere planet',
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
      seed: 'venus-seed',
    },
  },
  '4': {
    name: 'Ice Planet',
    description: 'Frozen world with distant star',
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
      seed: 'ice-planet',
    },
  },
  '5': {
    name: 'Ocean World',
    description: 'Water-covered planet with archipelagos',
    parameters: {
      radius: 6371000,
      solarConstant: 1361,
      orbitalTilt: 23.5,
      rotationPeriod: 24,
      seaLevel: 0.7,
      atmosphereDensity: 1.2,
      gridResolution: 3,
    },
    noiseConfig: {
      octaves: 6,
      persistence: 0.4,
      lacunarity: 2.0,
      scale: 0.8,
      redistributionPower: 1.5,
      seed: 'ocean-world',
    },
  },
};

function printBanner() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    🌍  WORLD SIMULATOR  🪐                ║');
  console.log('║    Physics-Based Climate & Biome Gen     ║');
  console.log('╚════════════════════════════════════════════╝\n');
}

function printPresets() {
  console.log('Available Presets:\n');
  Object.entries(PRESETS).forEach(([key, preset]) => {
    console.log(`  ${key}. ${preset.name}`);
    console.log(`     ${preset.description}\n`);
  });
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function printStatistics(simulator: WorldSimulator) {
  const stats = simulator.getStatistics();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           WORLD STATISTICS                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log(`Total cells: ${stats.totalCells.toLocaleString()}`);
  console.log(`Land cells: ${stats.landCells.toLocaleString()} (${((stats.landCells / stats.totalCells) * 100).toFixed(1)}%)`);
  console.log(`Ocean cells: ${stats.oceanCells.toLocaleString()} (${((stats.oceanCells / stats.totalCells) * 100).toFixed(1)}%)`);
  console.log(`Average temperature: ${stats.averageTemperature.toFixed(1)}°C`);
  console.log(`Average precipitation: ${stats.averagePrecipitation.toFixed(0)} mm/year`);

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         BIOME DISTRIBUTION                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const sortedBiomes = Object.entries(stats.biomeDistribution)
    .sort((a, b) => b[1] - a[1]);

  for (const [biome, count] of sortedBiomes) {
    const percentage = ((count / stats.totalCells) * 100).toFixed(1);
    const barLength = Math.floor(parseFloat(percentage) / 2);
    const bar = '█'.repeat(barLength);
    console.log(`${biome.padEnd(25)} ${bar} ${percentage}%`);
  }
}

function printSampleLocations(simulator: WorldSimulator) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         SAMPLE LOCATIONS                  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const locations = [
    { name: 'North Pole', lat: 90, lng: 0 },
    { name: 'Equator', lat: 0, lng: 0 },
    { name: 'South Pole', lat: -90, lng: 0 },
    { name: 'Mid-latitude North', lat: 45, lng: 0 },
    { name: 'Mid-latitude South', lat: -45, lng: 0 },
  ];

  for (const location of locations) {
    const cell = simulator.getCellAtLatLng(location.lat, location.lng);
    if (cell) {
      console.log(`${location.name} (${location.lat}°, ${location.lng}°):`);
      console.log(`  Elevation: ${(cell.elevation * 10000).toFixed(0)} m`);
      console.log(`  Temperature: ${cell.temperature.toFixed(1)}°C`);
      console.log(`  Precipitation: ${cell.precipitation.toFixed(0)} mm/year`);
      console.log(`  Biome: ${cell.biome}\n`);
    }
  }
}

async function runInteractive() {
  printBanner();
  printPresets();

  const choice = await promptUser('Select a preset (1-5) or press Enter for Earth-like: ');
  const presetKey = choice || '1';

  const preset = PRESETS[presetKey];
  if (!preset) {
    console.log('Invalid choice. Using Earth-like preset.');
    return runSimulation(PRESETS['1']);
  }

  console.log(`\nSelected: ${preset.name}`);
  console.log(`${preset.description}\n`);

  await runSimulation(preset);
}

async function runSimulation(preset: PresetConfig) {
  console.log('Initializing world simulator...');

  const simulator = new WorldSimulator({
    parameters: preset.parameters,
    noiseConfig: preset.noiseConfig,
  });

  console.log('\n🌍 Generating world... This may take a moment.\n');

  const startTime = Date.now();
  simulator.generateWorld();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✓ World generation complete in ${elapsed}s!`);

  printStatistics(simulator);
  printSampleLocations(simulator);

  console.log('╔════════════════════════════════════════════╗');
  console.log('║              EXPORT OPTIONS               ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log('To export as GeoJSON, use the API:');
  console.log('  const geojson = simulator.exportToGeoJSON();');
  console.log('  fs.writeFileSync("world.geojson", JSON.stringify(geojson));\n');
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
World Simulator - Physics-based climate and biome generator

USAGE:
  world-simulator [OPTIONS]

OPTIONS:
  --preset <1-5>    Select a preset (1=Earth, 2=Mars, 3=Venus, 4=Ice, 5=Ocean)
  --help, -h        Show this help message
  --version, -v     Show version

EXAMPLES:
  world-simulator              # Interactive mode
  world-simulator --preset 2   # Generate Mars-like planet
  world-simulator --preset 1   # Generate Earth-like planet

PRESETS:
  1. Earth-like  - Standard Earth with realistic climate
  2. Mars-like   - Cold, dry planet with thin atmosphere
  3. Venus-like  - Hot planet with thick atmosphere
  4. Ice Planet  - Frozen world with distant star
  5. Ocean World - Water-covered planet with archipelagos
    `);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('world-simulator v1.0.0');
    process.exit(0);
  }

  const presetIndex = args.indexOf('--preset');
  if (presetIndex !== -1 && args[presetIndex + 1]) {
    const presetKey = args[presetIndex + 1];
    const preset = PRESETS[presetKey];
    if (preset) {
      printBanner();
      console.log(`Running preset: ${preset.name}`);
      console.log(`${preset.description}\n`);
      runSimulation(preset);
      return;
    } else {
      console.error(`Invalid preset: ${presetKey}`);
      process.exit(1);
    }
  }

  runInteractive();
}

parseArgs();
