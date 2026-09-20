import { Injectable, Logger } from '@nestjs/common';
import { SyncLocationLevel } from '@prisma/client';
import * as indiaLocations from '../weather/data/india-locations.json';

export interface RegistryLocation {
  id: string;
  name: string;
  state: string;
  type: SyncLocationLevel;
  latitude: number | null;
  longitude: number | null;
  population?: number | null;
}

interface LocationRecord {
  id: string;
  name: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  population?: number | null;
  coordinateSource?: string;
}

interface IndiaLocationsFile {
  districts: LocationRecord[];
  majorCities: LocationRecord[];
}

@Injectable()
export class LocationRegistryService {
  private readonly logger = new Logger(LocationRegistryService.name);
  private locations: RegistryLocation[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const data = indiaLocations as unknown as IndiaLocationsFile;
    const districts: RegistryLocation[] = (
      data.districts ?? []
    ).map((d) => ({
      id: d.id,
      name: d.name,
      state: d.state,
      type: SyncLocationLevel.DISTRICT,
      latitude: d.latitude,
      longitude: d.longitude,
    }));
    const cities: RegistryLocation[] = (data.majorCities ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      type: SyncLocationLevel.CITY,
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population ?? null,
    }));
    this.locations = [...districts, ...cities];
    this.logger.log(
      `Loaded ${districts.length} districts and ${cities.length} cities from registry`,
    );
  }

  all(): RegistryLocation[] {
    return this.locations;
  }

  count(): { districts: number; cities: number; withCoordinates: number } {
    const cities = this.locations.filter((l) => l.type === SyncLocationLevel.CITY).length;
    return {
      districts: this.locations.length - cities,
      cities,
      withCoordinates: this.locations.filter(
        (l) => l.latitude != null && l.longitude != null,
      ).length,
    };
  }
}