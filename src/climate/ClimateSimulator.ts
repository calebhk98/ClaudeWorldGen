import { WorldParameters, ClimateData } from '../types';

export class ClimateSimulator {
  private params: WorldParameters;

  constructor(params: WorldParameters) {
    this.params = params;
  }

  calculateTemperature(
    latitude: number,
    longitude: number,
    elevation: number,
    seasonalDay: number = 0
  ): number {
    const latRad = (latitude * Math.PI) / 180;
    const tiltRad = (this.params.orbitalTilt * Math.PI) / 180;

    // Calculate seasonal angle using orbital period
    const seasonalAngle = (seasonalDay / this.params.orbitalPeriod) * 2 * Math.PI;
    const declination = tiltRad * Math.sin(seasonalAngle);

    // Determine if planet is tidally locked (rotation period > 1000 hours means very slow rotation)
    const isTidallyLocked = this.params.rotationPeriod > 1000;

    let insolation: number;

    if (isTidallyLocked) {
      // For tidally locked planets, temperature depends on longitude
      // 0° longitude = subsolar point (always facing star)
      // 180° longitude = antisolar point (always dark)
      const subsolarLongitude = 0; // Assume 0° is the locked face
      const angularDistance = Math.abs(longitude - subsolarLongitude);
      const normalizedDistance = Math.min(angularDistance, 360 - angularDistance);

      // Calculate insolation based on distance from subsolar point
      const distRad = (normalizedDistance * Math.PI) / 180;
      const latDistanceFactor = Math.cos(distRad) * Math.cos(latRad);

      insolation = this.params.solarConstant * Math.max(0, latDistanceFactor);

      // Add very small ambient heat from atmospheric circulation (if any atmosphere)
      const minAmbientTemp = this.params.atmosphereDensity * 5; // Kelvin
      insolation = Math.max(insolation, minAmbientTemp);
    } else {
      // For rotating planets, consider day/night cycle
      const timeOfDay = this.params.timeOfDay || 12;

      // Calculate hour angle (0 = noon, 12 = midnight)
      const hourAngle = ((timeOfDay - 12) / 12) * Math.PI;

      // Solar elevation angle considering both latitude and time of day
      const solarElevationAngle = Math.asin(
        Math.sin(latRad) * Math.sin(declination) +
        Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)
      );

      insolation = this.params.solarConstant * Math.max(0, Math.sin(solarElevationAngle));

      // For fast-rotating planets, average out day/night somewhat
      const rotationDampening = Math.min(1, this.params.rotationPeriod / 24);
      const nighttimeTempRetention = this.params.atmosphereDensity * 0.3 * (1 - rotationDampening);

      if (insolation === 0) {
        // Nighttime - retain some heat
        insolation = this.params.solarConstant * nighttimeTempRetention;
      }
    }

    const baseTemp = this.insolationToTemperature(insolation);

    // Elevation lapse rate
    const lapseRate = 6.5;
    const elevationKm = (elevation - this.params.seaLevel) / 1000;
    const tempAdjustment = -lapseRate * elevationKm;

    // Atmospheric greenhouse effect
    const atmosphericEffect = this.params.atmosphereDensity * 15;

    return baseTemp + tempAdjustment + atmosphericEffect;
  }

  private insolationToTemperature(insolation: number): number {
    const albedo = 0.3;
    const stefanBoltzmann = 5.67e-8;
    const effectiveInsolation = insolation * (1 - albedo);

    const effectiveTemp = Math.pow(
      effectiveInsolation / (4 * stefanBoltzmann),
      0.25
    );

    return effectiveTemp - 273.15;
  }

  calculatePrecipitation(
    latitude: number,
    elevation: number,
    temperature: number,
    distanceToOcean: number = 0
  ): number {
    const latRad = Math.abs((latitude * Math.PI) / 180);

    let baseRainfall: number;
    const absLat = Math.abs(latitude);

    if (absLat < 10) {
      baseRainfall = 2500;
    } else if (absLat < 30) {
      baseRainfall = 1500 - (absLat - 10) * 50;
    } else if (absLat < 60) {
      baseRainfall = 500 + (absLat - 30) * 10;
    } else {
      baseRainfall = 300;
    }

    const elevationEffect = Math.max(0, elevation - this.params.seaLevel) / 1000;
    const orographicLift = elevationEffect * 200;

    const maxTemp = 30;
    const minTemp = -10;
    const tempFactor = Math.max(0, (temperature - minTemp) / (maxTemp - minTemp));
    const tempEffect = tempFactor * 500;

    const oceanEffect = Math.exp(-distanceToOcean / 1000) * 500;

    const totalPrecipitation = baseRainfall + orographicLift + tempEffect + oceanEffect;

    return Math.max(0, totalPrecipitation);
  }

  calculateClimate(
    latitude: number,
    longitude: number,
    elevation: number,
    distanceToOcean: number = 0,
    seasonalDay: number = 0
  ): ClimateData {
    const temperature = this.calculateTemperature(latitude, longitude, elevation, seasonalDay);
    const precipitation = this.calculatePrecipitation(
      latitude,
      elevation,
      temperature,
      distanceToOcean
    );

    const humidity = this.calculateHumidity(temperature, precipitation);
    const windSpeed = this.calculateWindSpeed(latitude, elevation);

    return {
      temperature,
      precipitation,
      humidity,
      windSpeed,
    };
  }

  private calculateHumidity(temperature: number, precipitation: number): number {
    const maxHumidity = 100;
    const tempFactor = Math.max(0, Math.min(1, (temperature + 10) / 40));
    const precipFactor = Math.min(1, precipitation / 2000);

    return maxHumidity * tempFactor * precipFactor;
  }

  private calculateWindSpeed(latitude: number, elevation: number): number {
    const absLat = Math.abs(latitude);

    let baseWind: number;
    if (absLat < 30) {
      baseWind = 3 + absLat * 0.1;
    } else if (absLat < 60) {
      baseWind = 6 + (absLat - 30) * 0.2;
    } else {
      baseWind = 12 + (absLat - 60) * 0.3;
    }

    const elevationEffect = Math.max(0, elevation - this.params.seaLevel) / 1000;
    const windBoost = elevationEffect * 2;

    return baseWind + windBoost;
  }

  getAverageAnnualTemperature(latitude: number, longitude: number, elevation: number): number {
    let totalTemp = 0;
    const samples = 12;

    for (let month = 0; month < samples; month++) {
      const day = (month * this.params.orbitalPeriod) / samples;
      totalTemp += this.calculateTemperature(latitude, longitude, elevation, day);
    }

    return totalTemp / samples;
  }

  getAverageAnnualPrecipitation(
    latitude: number,
    longitude: number,
    elevation: number,
    distanceToOcean: number = 0
  ): number {
    let totalPrecip = 0;
    const samples = 12;

    for (let month = 0; month < samples; month++) {
      const day = (month * this.params.orbitalPeriod) / samples;
      const temp = this.calculateTemperature(latitude, longitude, elevation, day);
      totalPrecip += this.calculatePrecipitation(latitude, elevation, temp, distanceToOcean);
    }

    return totalPrecip / samples;
  }
}
