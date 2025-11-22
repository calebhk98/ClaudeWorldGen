# Claude World Simulator

A physics-based world simulator that generates realistic climate biomes based on planetary parameters. Supports both procedural generation using noise algorithms and importing real-world height map data (such as NASA SRTM data).

## Features

- 🌍 **Spherical Grid System**: Uses H3 hexagonal hierarchical geospatial indexing for accurate planetary representation
- 🏔️ **Height Map Generation**: Procedural terrain generation using Simplex noise with multiple octaves
- 📊 **Height Map Import**: Load external height map data from NASA or other sources
- 🌡️ **Physics-Based Climate**: Realistic temperature and precipitation calculations based on:
  - Solar radiation and latitude
  - Orbital tilt and seasonal variations
  - Elevation and atmospheric effects
  - Distance to ocean
- 🌲 **Biome Classification**: Whittaker-inspired biome system with 12 distinct biome types
- 🪐 **Custom Planets**: Simulate Earth-like, Mars-like, Venus-like, or completely custom worlds
- 📈 **Statistics & Export**: Generate world statistics and export to GeoJSON format

## Installation

```bash
npm install
```

## Quick Start

```typescript
import { WorldSimulator } from './src/WorldSimulator';

// Create a world simulator with Earth-like parameters
const simulator = new WorldSimulator({
  parameters: {
    radius: 6371000,        // Earth's radius in meters
    solarConstant: 1361,    // Solar energy (W/m²)
    orbitalTilt: 23.5,      // Axial tilt in degrees
    rotationPeriod: 24,     // Hours per day
    seaLevel: 0.5,          // Normalized sea level (0-1)
    atmosphereDensity: 1.0, // Relative to Earth
    gridResolution: 4,      // H3 resolution (0-15)
  },
  noiseConfig: {
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 1.0,
    redistributionPower: 2.0,
  },
});

// Generate the world
simulator.generateWorld();

// Get statistics
const stats = simulator.getStatistics();
console.log(stats);

// Query specific location
const cell = simulator.getCellAtLatLng(45, -122); // Portland, OR
console.log(cell?.biome); // e.g., "Temperate Forest"

// Export to GeoJSON
const geojson = simulator.exportToGeoJSON();
```

## Architecture

### Components

1. **GridSystem** (`src/grid/GridSystem.ts`)
   - Manages H3 hexagonal grid cells
   - Handles spatial queries and neighbor relationships
   - Supports resolutions 0-15 (global to city-scale)

2. **HeightMapGenerator** (`src/terrain/HeightMapGenerator.ts`)
   - Generates terrain using Simplex noise
   - Supports multiple octaves for detail
   - Can load external height map data
   - Uses 3D noise on sphere for seamless wrapping

3. **ClimateSimulator** (`src/climate/ClimateSimulator.ts`)
   - Calculates temperature based on:
     - Latitude and solar angle
     - Seasonal variations from orbital tilt
     - Elevation (lapse rate)
     - Atmospheric effects
   - Calculates precipitation based on:
     - Latitude (ITCZ, Hadley cells)
     - Elevation (orographic lift)
     - Temperature and humidity
     - Distance to ocean

4. **BiomeClassifier** (`src/biome/BiomeClassifier.ts`)
   - Maps climate data to biome types
   - Uses temperature-precipitation matrix
   - Supports 12 biome types:
     - Ocean, Ice, Tundra, Taiga
     - Temperate Forest, Temperate Grassland
     - Desert, Subtropical Desert
     - Savanna, Tropical Seasonal Forest
     - Tropical Rainforest, Alpine

5. **WorldSimulator** (`src/WorldSimulator.ts`)
   - Main orchestrator class
   - Integrates all components
   - Provides statistics and export functionality

## Examples

### Basic Earth-like World

```bash
npm run dev
```

Runs `src/examples/basic.ts` which generates an Earth-like world and displays statistics.

### Custom Planets

```bash
npx ts-node src/examples/custom-planet.ts
```

Demonstrates creating Mars-like, Venus-like, and ice planets with different parameters.

### Height Map Import

```bash
npx ts-node src/examples/heightmap-import.ts
```

Shows how to import external height map data (e.g., from NASA).

## Using NASA Height Map Data

To use real Earth data from NASA SRTM or similar sources:

```typescript
import { WorldSimulator } from './src/WorldSimulator';
import { HeightMapData } from './src/types';

// Example: Load and process NASA height map
// (You'll need additional libraries like 'sharp' or 'geotiff')

const heightMap: HeightMapData = {
  width: 3600,  // e.g., SRTM resolution
  height: 1800,
  data: normalizedElevationData, // Float32Array, normalized 0-1
  min: 0.0,
  max: 1.0,
};

const simulator = new WorldSimulator({
  parameters: {
    radius: 6371000,
    solarConstant: 1361,
    orbitalTilt: 23.5,
    rotationPeriod: 24,
    seaLevel: 0.5, // Adjust based on your data
    atmosphereDensity: 1.0,
    gridResolution: 4,
  },
  externalHeightMap: heightMap,
});

simulator.generateWorld();
```

## Grid Resolution Guide

H3 resolution determines the number of cells and detail level:

| Resolution | Avg Cell Area | Total Cells | Use Case |
|------------|---------------|-------------|----------|
| 0 | 4,250,547 km² | 122 | Continental |
| 1 | 607,221 km² | 842 | Continental |
| 2 | 86,745 km² | 5,882 | Regional |
| 3 | 12,393 km² | 41,162 | Regional |
| 4 | 1,770 km² | 288,122 | **Recommended** |
| 5 | 253 km² | 2,016,842 | High detail |
| 6 | 36 km² | 14,117,882 | Very high detail |

Higher resolutions provide more detail but increase computation time exponentially.

## Configuration Options

### WorldParameters

```typescript
interface WorldParameters {
  radius: number;              // Planet radius in meters
  solarConstant: number;       // Solar energy in W/m²
  orbitalTilt: number;         // Axial tilt in degrees
  rotationPeriod: number;      // Day length in hours
  seaLevel: number;            // Normalized sea level (0-1)
  atmosphereDensity: number;   // Relative to Earth (affects temperature)
  gridResolution: number;      // H3 resolution (0-15)
}
```

### NoiseConfig

```typescript
interface NoiseConfig {
  seed?: string;              // Random seed for reproducibility
  octaves?: number;           // Detail layers (default: 6)
  persistence?: number;       // Amplitude decay (default: 0.5)
  lacunarity?: number;        // Frequency increase (default: 2.0)
  scale?: number;             // Overall scale (default: 1.0)
  redistributionPower?: number; // Elevation distribution (default: 2.0)
}
```

## API Reference

### WorldSimulator

#### Methods

- `generateWorld(): void` - Generate all cell data
- `getCellData(cellId: string): CellData | undefined` - Get data for specific cell
- `getCellAtLatLng(lat: number, lng: number): CellData | undefined` - Query by coordinates
- `getAllCells(): CellData[]` - Get all generated cells
- `getStatistics()` - Get world statistics
- `exportToGeoJSON()` - Export as GeoJSON
- `getParameters(): WorldParameters` - Get current parameters

### CellData

```typescript
interface CellData {
  cellId: string;         // H3 cell identifier
  latitude: number;       // Latitude in degrees
  longitude: number;      // Longitude in degrees
  elevation: number;      // Normalized elevation (0-1)
  temperature: number;    // Average temperature in °C
  precipitation: number;  // Annual precipitation in mm
  biome: BiomeType;       // Classified biome
  isOcean: boolean;       // Whether below sea level
}
```

## Performance Considerations

- Resolution 4 generates ~288,000 cells (fast, recommended for most uses)
- Resolution 5 generates ~2,000,000 cells (slower, high detail)
- Resolution 6+ may require significant memory and computation time
- Consider using lower resolutions for rapid prototyping

## Biome Types

The simulator classifies cells into these biomes based on temperature and precipitation:

- **Ocean** - Water bodies below sea level
- **Ice** - Permanent ice caps (< -15°C)
- **Tundra** - Cold, treeless plains
- **Taiga** - Boreal forests
- **Temperate Forest** - Deciduous/mixed forests
- **Temperate Grassland** - Prairies and steppes
- **Desert** - Arid regions
- **Subtropical Desert** - Hot, dry regions
- **Savanna** - Tropical grasslands
- **Tropical Seasonal Forest** - Monsoon forests
- **Tropical Rainforest** - Wet tropical forests
- **Alpine** - High mountain terrain

## Future Enhancements

Potential additions:
- Ocean currents simulation
- Wind patterns (Hadley, Ferrel, Polar cells)
- Seasonal climate variations
- Plate tectonics simulation
- River network generation
- Humidity and cloud cover
- Day/night temperature variations
- Advanced atmosphere modeling

## License

MIT

## Contributing

Contributions welcome! This simulator can be extended with additional climate models, biome types, or planetary phenomena.

## Credits

Built using:
- [H3](https://h3geo.org/) - Hexagonal hierarchical geospatial indexing
- [simplex-noise](https://github.com/jwagner/simplex-noise.js) - Simplex noise generation
