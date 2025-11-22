import express from 'express';
import cors from 'cors';
import path from 'path';
import open from 'open';
import multer from 'multer';
import sharp from 'sharp';
import { WorldSimulator } from './WorldSimulator';
import { BiomeType } from './types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

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
    const { presetId, customParams } = req.body;
    let preset;
    let parameters;
    let noiseConfig;

    if (presetId === 'custom' && customParams) {
      // Use custom parameters
      console.log('Generating custom world with parameters:', customParams);

      parameters = {
        radius: 6371000, // Default Earth radius
        solarConstant: customParams.solarConstant || 1361,
        orbitalTilt: customParams.orbitalTilt || 23.5,
        rotationPeriod: 24,
        seaLevel: customParams.seaLevel || 0.5,
        atmosphereDensity: customParams.atmosphereDensity || 1.0,
        gridResolution: customParams.gridResolution || 4,
      };

      noiseConfig = {
        octaves: 6,
        persistence: 0.5,
        lacunarity: 2.0,
        scale: 1.0,
        redistributionPower: 2.0,
      };

      preset = {
        name: 'Custom',
        description: 'Custom user-defined world',
      };
    } else {
      // Use preset
      preset = PRESETS[presetId || '1'];

      if (!preset) {
        return res.status(400).json({ error: 'Invalid preset ID' });
      }

      console.log(`Generating ${preset.name} world...`);
      parameters = preset.parameters;
      noiseConfig = preset.noiseConfig;
    }

    const simulator = new WorldSimulator({
      parameters,
      noiseConfig,
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
        windSpeed: cell.windSpeed,
        windDirection: cell.windDirection,
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

// Endpoint for generating world with custom heightmap
app.post('/api/generate-with-heightmap', upload.single('heightmap'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No heightmap file uploaded' });
    }

    const params = JSON.parse(req.body.params);
    const customParams = params.customParams;

    console.log('Processing heightmap upload...');

    // Process the image to extract heightmap data
    const imageBuffer = req.file.buffer;
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(`Heightmap dimensions: ${info.width}x${info.height}`);

    // Convert image data to Float32Array and find min/max
    const heightmapData = new Float32Array(info.width * info.height);
    let min = Infinity;
    let max = -Infinity;

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const value = data[idx] / 255.0; // Normalize to 0-1
        heightmapData[y * info.width + x] = value;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }

    // Create parameters
    const parameters = {
      radius: 6371000,
      solarConstant: customParams.solarConstant || 1361,
      orbitalTilt: customParams.orbitalTilt || 23.5,
      rotationPeriod: 24,
      seaLevel: customParams.seaLevel || 0.5,
      atmosphereDensity: customParams.atmosphereDensity || 1.0,
      gridResolution: customParams.gridResolution || 4,
    };

    // Create a custom heightmap config
    const externalHeightMap = {
      data: heightmapData,
      width: info.width,
      height: info.height,
      min,
      max,
    };

    const simulator = new WorldSimulator({
      parameters,
      externalHeightMap,
    });

    const startTime = Date.now();
    simulator.generateWorld();
    const elapsed = Date.now() - startTime;

    const cells = simulator.getAllCells();
    const stats = simulator.getStatistics();

    console.log(`Generated world with heightmap in ${elapsed}ms with ${cells.length} cells`);

    res.json({
      cells: cells.map(cell => ({
        lat: cell.latitude,
        lng: cell.longitude,
        elevation: cell.elevation,
        temperature: cell.temperature,
        precipitation: cell.precipitation,
        biome: cell.biome,
        isOcean: cell.isOcean,
        windSpeed: cell.windSpeed,
        windDirection: cell.windDirection,
      })),
      stats,
      preset: {
        name: 'Custom (with heightmap)',
        description: 'Custom world with uploaded heightmap',
      },
      generationTime: elapsed,
    });
  } catch (error) {
    console.error('Error generating world with heightmap:', error);
    res.status(500).json({ error: 'Failed to generate world with heightmap' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║    🌍  WORLD SIMULATOR VIEWER  🪐         ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`Server running at ${url}`);
  console.log('\nOpening browser...\n');

  try {
    await open(url);
  } catch (error) {
    console.log('Could not automatically open browser.');
    console.log(`Please manually open: ${url}\n`);
  }
});
