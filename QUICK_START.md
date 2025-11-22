# Quick Start Guide

## Get Up and Running in 4 Commands

```bash
git clone https://github.com/calebhk98/ClaudeWorldGen.git
cd ClaudeWorldGen
npm install
npm start
```

## What Happens Next?

**Your browser will automatically open** to http://localhost:3000 and you'll see the visual world simulator interface:

```
╔════════════════════════════════════════════╗
║    🌍  WORLD SIMULATOR  🪐                ║
║    Physics-Based Climate & Biome Gen     ║
╚════════════════════════════════════════════╝

Available Presets:

  1. Earth-like
     Standard Earth-like planet with realistic climate

  2. Mars-like
     Cold, dry planet with thin atmosphere

  3. Venus-like
     Hot, thick atmosphere planet

  4. Ice Planet
     Frozen world with distant star

  5. Ocean World
     Water-covered planet with archipelagos

Select a preset (1-5) or press Enter for Earth-like:
```

## Other Ways to Run

### Run a specific preset directly:

```bash
npm start -- --preset 2   # Mars-like planet
```

### See all options:

```bash
npm start -- --help
```

### Run example scripts:

```bash
npm run example:basic       # Basic Earth example
npm run example:custom      # Multiple custom planets
npm run example:heightmap   # Height map import demo
```

## Output

The simulator will show you:
- **World Statistics** - Total cells, land/ocean ratio, average climate
- **Biome Distribution** - Visual bar chart of biome types
- **Sample Locations** - Climate data at key latitudes
- **Export Options** - How to export data as GeoJSON

## Using as a Library

See the [main README](README.md) for API documentation and library usage examples.

## Need Help?

- Full documentation: [README.md](README.md)
- Examples: Check the `src/examples/` folder
- API reference: See the Architecture section in README.md
