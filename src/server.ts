import express from 'express';
import cors from 'cors';
import path from 'path';
import { WorldSimulator } from './WorldSimulator';
import { BiomeType } from './types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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

app.get('/api/presets', (req, res) => {
  const presetList = Object.entries(PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    description: preset.description,
  }));
  res.json(presetList);
});

app.post('/api/generate', (req, res) => {
  try {
    const { presetId } = req.body;
    const preset = PRESETS[presetId || '1'];

    if (!preset) {
      return res.status(400).json({ error: 'Invalid preset ID' });
    }

    console.log(`Generating ${preset.name} world...`);

    const simulator = new WorldSimulator({
      parameters: preset.parameters,
      noiseConfig: preset.noiseConfig,
    });

    const startTime = Date.now();
    simulator.generateWorld();
    const elapsed = Date.now() - startTime;

    const cells = simulator.getAllCells();
    const stats = simulator.getStatistics();

    console.log(`Generated in ${elapsed}ms with ${cells.length} cells`);

    res.json({
      cells: cells.map(cell => ({
        lat: cell.latitude,
        lng: cell.longitude,
        elevation: cell.elevation,
        temperature: cell.temperature,
        precipitation: cell.precipitation,
        biome: cell.biome,
        isOcean: cell.isOcean,
      })),
      stats,
      preset: {
        name: preset.name,
        description: preset.description,
      },
      generationTime: elapsed,
    });
  } catch (error) {
    console.error('Error generating world:', error);
    res.status(500).json({ error: 'Failed to generate world' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    🌍  WORLD SIMULATOR VIEWER  🪐         ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('\nOpen your browser to visualize generated worlds!\n');
});
