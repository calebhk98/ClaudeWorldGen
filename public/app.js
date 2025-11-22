const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const presetSelect = document.getElementById('preset');
const loadingState = document.getElementById('loadingState');
const infoContent = document.getElementById('infoContent');
const hoverInfo = document.getElementById('hoverInfo');

const BIOME_COLORS = {
    'Ocean': '#1e3a8a',
    'Ice': '#f0f9ff',
    'Tundra': '#bae6fd',
    'Taiga': '#10b981',
    'Temperate Forest': '#22c55e',
    'Temperate Grassland': '#84cc16',
    'Desert': '#fbbf24',
    'Savanna': '#bef264',
    'Tropical Rainforest': '#065f46',
    'Tropical Seasonal Forest': '#16a34a',
    'Alpine': '#94a3b8',
    'Subtropical Desert': '#f59e0b',
};

let worldData = null;

function latLngToPixel(lat, lng, width, height) {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x: Math.floor(x), y: Math.floor(y) };
}

function pixelToLatLng(x, y, width, height) {
    const lng = (x / width) * 360 - 180;
    const lat = 90 - (y / height) * 180;
    return { lat, lng };
}

function findNearestCell(lat, lng, cells) {
    let minDist = Infinity;
    let nearest = null;

    for (const cell of cells) {
        const dist = Math.sqrt(
            Math.pow(lat - cell.lat, 2) +
            Math.pow(lng - cell.lng, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = cell;
        }
    }

    return nearest;
}

function renderWorld(data) {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Create a grid to accumulate cells
    const gridSize = 2; // Size of each pixel square
    const gridWidth = Math.ceil(width / gridSize);
    const gridHeight = Math.ceil(height / gridSize);
    const grid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));

    // Map cells to grid
    for (const cell of data.cells) {
        const pos = latLngToPixel(cell.lat, cell.lng, width, height);
        const gridX = Math.floor(pos.x / gridSize);
        const gridY = Math.floor(pos.y / gridSize);

        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            if (!grid[gridY][gridX]) {
                grid[gridY][gridX] = [];
            }
            grid[gridY][gridX].push(cell);
        }
    }

    // Render grid
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x] && grid[y][x].length > 0) {
                // Use the most common biome in this grid cell
                const biomes = {};
                for (const cell of grid[y][x]) {
                    biomes[cell.biome] = (biomes[cell.biome] || 0) + 1;
                }
                const mostCommon = Object.keys(biomes).reduce((a, b) =>
                    biomes[a] > biomes[b] ? a : b
                );

                ctx.fillStyle = BIOME_COLORS[mostCommon] || '#888';
                ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        }
    }

    // Add grid lines for lat/lng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
        const x = ((lng + 180) / 360) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Latitude lines
    for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    worldData = data;
}

function updateStatistics(data) {
    const stats = data.stats;

    document.getElementById('totalCells').textContent = stats.totalCells.toLocaleString();
    document.getElementById('landCells').textContent =
        `${stats.landCells.toLocaleString()} (${((stats.landCells / stats.totalCells) * 100).toFixed(1)}%)`;
    document.getElementById('oceanCells').textContent =
        `${stats.oceanCells.toLocaleString()} (${((stats.oceanCells / stats.totalCells) * 100).toFixed(1)}%)`;
    document.getElementById('avgTemp').textContent = `${stats.averageTemperature.toFixed(1)}°C`;
    document.getElementById('avgPrecip').textContent = `${stats.averagePrecipitation.toFixed(0)} mm/year`;
    document.getElementById('genTime').textContent = `${data.generationTime}ms`;

    // Biome distribution
    const biomeList = document.getElementById('biomeList');
    biomeList.innerHTML = '';

    const sortedBiomes = Object.entries(stats.biomeDistribution)
        .sort((a, b) => b[1] - a[1]);

    for (const [biome, count] of sortedBiomes) {
        const percentage = ((count / stats.totalCells) * 100).toFixed(1);

        const item = document.createElement('div');
        item.className = 'biome-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'biome-color';
        colorBox.style.backgroundColor = BIOME_COLORS[biome] || '#888';

        const info = document.createElement('div');
        info.className = 'biome-info';
        info.innerHTML = `
            <div class="biome-name">${biome}</div>
            <div class="biome-percent">${percentage}% (${count.toLocaleString()} cells)</div>
        `;

        item.appendChild(colorBox);
        item.appendChild(info);
        biomeList.appendChild(item);
    }
}

async function generateWorld() {
    const presetId = presetSelect.value;

    generateBtn.disabled = true;
    loadingState.style.display = 'block';
    infoContent.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ presetId }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate world');
        }

        const data = await response.json();

        renderWorld(data);
        updateStatistics(data);

        loadingState.style.display = 'none';
        infoContent.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate world. Make sure the server is running.');
        loadingState.style.display = 'none';
    } finally {
        generateBtn.disabled = false;
    }
}

// Mouse hover to show cell info
canvas.addEventListener('mousemove', (e) => {
    if (!worldData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const latLng = pixelToLatLng(x, y, canvas.width, canvas.height);
    const cell = findNearestCell(latLng.lat, latLng.lng, worldData.cells);

    if (cell) {
        hoverInfo.style.display = 'block';
        hoverInfo.innerHTML = `
            <p><strong>Location:</strong> ${cell.lat.toFixed(2)}°, ${cell.lng.toFixed(2)}°</p>
            <p><strong>Biome:</strong> ${cell.biome}</p>
            <p><strong>Elevation:</strong> ${(cell.elevation * 10000).toFixed(0)} m</p>
            <p><strong>Temperature:</strong> ${cell.temperature.toFixed(1)}°C</p>
            <p><strong>Precipitation:</strong> ${cell.precipitation.toFixed(0)} mm/year</p>
        `;
    }
});

canvas.addEventListener('mouseleave', () => {
    hoverInfo.style.display = 'none';
});

generateBtn.addEventListener('click', generateWorld);

// Generate default world on load
window.addEventListener('load', () => {
    setTimeout(generateWorld, 500);
});
