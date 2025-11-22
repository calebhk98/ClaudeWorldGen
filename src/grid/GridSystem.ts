import { cellToLatLng, latLngToCell, gridDisk } from 'h3-js';

export interface GridCell {
  cellId: string;
  latitude: number;
  longitude: number;
  neighbors: string[];
}

export class GridSystem {
  private resolution: number;
  private cells: Map<string, GridCell>;

  constructor(resolution: number = 4) {
    if (resolution < 0 || resolution > 15) {
      throw new Error('H3 resolution must be between 0 and 15');
    }
    this.resolution = resolution;
    this.cells = new Map();
    this.initializeCells();
  }

  private initializeCells(): void {
    const allCells = new Set<string>();

    const latSteps = Math.max(10, this.resolution * 20);
    const lngSteps = Math.max(20, this.resolution * 40);

    for (let latIdx = 0; latIdx < latSteps; latIdx++) {
      const lat = 90 - (latIdx / latSteps) * 180;

      for (let lngIdx = 0; lngIdx < lngSteps; lngIdx++) {
        const lng = -180 + (lngIdx / lngSteps) * 360;
        const cellId = latLngToCell(lat, lng, this.resolution);
        allCells.add(cellId);
      }
    }

    for (const cellId of allCells) {
      const [lat, lng] = cellToLatLng(cellId);
      const neighbors = gridDisk(cellId, 1).filter(id => id !== cellId);

      this.cells.set(cellId, {
        cellId,
        latitude: lat,
        longitude: lng,
        neighbors,
      });
    }
  }

  getCellAtLatLng(lat: number, lng: number): string {
    return latLngToCell(lat, lng, this.resolution);
  }

  getAllCells(): GridCell[] {
    return Array.from(this.cells.values());
  }

  getCell(cellId: string): GridCell | undefined {
    return this.cells.get(cellId);
  }

  getNeighbors(cellId: string): GridCell[] {
    const cell = this.cells.get(cellId);
    if (!cell) return [];

    return cell.neighbors
      .map(id => this.cells.get(id))
      .filter((c): c is GridCell => c !== undefined);
  }

  getCellCount(): number {
    return this.cells.size;
  }

  getResolution(): number {
    return this.resolution;
  }
}
