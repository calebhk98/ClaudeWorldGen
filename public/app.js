const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const presetSelect = document.getElementById('preset');
const loadingState = document.getElementById('loadingState');
const infoContent = document.getElementById('infoContent');
const hoverInfo = document.getElementById('hoverInfo');
const showWindToggle = document.getElementById('showWindToggle');

const BIOME_COLORS = {
    'Ocean': '#1e40af',              // Deep blue
    'Ice': '#e0f2fe',                // Very light blue/white
    'Tundra': '#67e8f9',             // Bright cyan
    'Taiga': '#10b981',              // Emerald green
    'Temperate Forest': '#22c55e',   // Green
    'Temperate Grassland': '#a3e635', // Lime green
    'Desert': '#fbbf24',             // Amber
    'Savanna': '#d9f99d',            // Light lime
    'Tropical Rainforest': '#15803d', // Dark green
    'Tropical Seasonal Forest': '#22c55e', // Green
    'Alpine': '#cbd5e1',             // Light gray
    'Subtropical Desert': '#f59e0b', // Orange
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

    // Clear canvas with ocean color as base
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, width, height);

    // Dynamically calculate grid size based on number of cells
    // More cells = smaller grid size, fewer cells = larger grid size
    const cellCount = data.cells.length;
    let gridSize = 4; // Default size
    if (cellCount < 1000) gridSize = 8;
    else if (cellCount < 3000) gridSize = 6;
    else if (cellCount < 10000) gridSize = 4;
    else gridSize = 3;

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

    // Render grid with better visibility
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

    // Draw wind visualization if enabled
    if (showWindToggle.checked) {
        drawWindArrows(data, width, height);
    }

    worldData = data;
}

function drawWindArrows(data, width, height) {
    const spacing = 50; // Pixels between arrows
    const arrowLength = 15;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;

    for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
            const latLng = pixelToLatLng(x, y, width, height);
            const cell = findNearestCell(latLng.lat, latLng.lng, data.cells);

            if (cell && cell.windSpeed && cell.windDirection !== undefined) {
                // Scale arrow length by wind speed
                const scaledLength = Math.min(arrowLength * (cell.windSpeed / 10), arrowLength * 1.5);

                // Convert wind direction to radians (wind direction is where wind is going TO)
                const dirRad = (cell.windDirection * Math.PI) / 180;

                // Calculate arrow end point
                const endX = x + Math.sin(dirRad) * scaledLength;
                const endY = y - Math.cos(dirRad) * scaledLength;

                // Draw arrow shaft
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Draw arrowhead
                const headLength = 5;
                const headAngle = Math.PI / 6; // 30 degrees

                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - headLength * Math.sin(dirRad - headAngle),
                    endY + headLength * Math.cos(dirRad - headAngle)
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - headLength * Math.sin(dirRad + headAngle),
                    endY + headLength * Math.cos(dirRad + headAngle)
                );
                ctx.stroke();
            }
        }
    }
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
        let requestBody = {};

        if (presetId === 'custom') {
            // Get custom parameters
            const seaLevel = parseFloat(document.getElementById('seaLevel').value);
            const axialTilt = parseFloat(document.getElementById('axialTilt').value);
            const solarEnergy = parseFloat(document.getElementById('solarEnergy').value);
            const quality = parseInt(document.getElementById('quality').value);
            const atmosphereDensity = parseFloat(document.getElementById('atmosphereDensity').value);
            const rotationPeriod = parseFloat(document.getElementById('rotationPeriod').value);
            const orbitalPeriod = parseFloat(document.getElementById('orbitalPeriod').value);
            const timeOfDay = parseFloat(document.getElementById('timeOfDay').value);

            requestBody = {
                presetId: 'custom',
                customParams: {
                    seaLevel,
                    orbitalTilt: axialTilt,
                    solarConstant: solarEnergy,
                    gridResolution: quality,
                    atmosphereDensity,
                    rotationPeriod,
                    orbitalPeriod,
                    timeOfDay
                }
            };

            // Check if heightmap file is uploaded
            const heightmapFile = document.getElementById('heightmapFile').files[0];
            if (heightmapFile) {
                const formData = new FormData();
                formData.append('heightmap', heightmapFile);
                formData.append('params', JSON.stringify(requestBody));

                const response = await fetch('http://localhost:3000/api/generate-with-heightmap', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to generate world with heightmap');
                }

                const data = await response.json();
                renderWorld(data);
                updateStatistics(data);
                loadingState.style.display = 'none';
                infoContent.style.display = 'block';
                generateBtn.disabled = false;
                return;
            }
        } else {
            requestBody = { presetId };
        }

        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
        const windInfo = cell.windSpeed !== undefined && cell.windDirection !== undefined
            ? `<p><strong>Wind:</strong> ${cell.windSpeed.toFixed(1)} m/s, ${cell.windDirection.toFixed(0)}°</p>`
            : '';
        hoverInfo.innerHTML = `
            <p><strong>Location:</strong> ${cell.lat.toFixed(2)}°, ${cell.lng.toFixed(2)}°</p>
            <p><strong>Biome:</strong> ${cell.biome}</p>
            <p><strong>Elevation:</strong> ${(cell.elevation * 10000).toFixed(0)} m</p>
            <p><strong>Temperature:</strong> ${cell.temperature.toFixed(1)}°C</p>
            <p><strong>Precipitation:</strong> ${cell.precipitation.toFixed(0)} mm/year</p>
            ${windInfo}
        `;
    }
});

canvas.addEventListener('mouseleave', () => {
    hoverInfo.style.display = 'none';
});

generateBtn.addEventListener('click', generateWorld);

// Show/hide custom controls based on preset selection
presetSelect.addEventListener('change', () => {
    const customControls = document.getElementById('customControls');
    if (presetSelect.value === 'custom') {
        customControls.style.display = 'block';
    } else {
        customControls.style.display = 'none';
    }
});

// Update slider value displays
function setupSliderListeners() {
    const sliders = [
        { id: 'seaLevel', valueId: 'seaLevelValue', format: (v) => v },
        { id: 'axialTilt', valueId: 'axialTiltValue', format: (v) => v },
        { id: 'solarEnergy', valueId: 'solarEnergyValue', format: (v) => v },
        { id: 'quality', valueId: 'qualityValue', format: (v) => v },
        { id: 'atmosphereDensity', valueId: 'atmosphereDensityValue', format: (v) => v },
        { id: 'rotationPeriod', valueId: 'rotationPeriodValue', format: (v) => v },
        { id: 'orbitalPeriod', valueId: 'orbitalPeriodValue', format: (v) => v },
        { id: 'timeOfDay', valueId: 'timeOfDayValue', format: (v) => v }
    ];

    sliders.forEach(({ id, valueId, format }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        slider.addEventListener('input', () => {
            valueDisplay.textContent = format(slider.value);
        });
    });
}

// Initialize slider listeners
setupSliderListeners();

// Wind toggle listener
showWindToggle.addEventListener('change', () => {
    if (worldData) {
        renderWorld(worldData);
    }
});

// Generate default world on load
window.addEventListener('load', () => {
    setTimeout(generateWorld, 500);
});
