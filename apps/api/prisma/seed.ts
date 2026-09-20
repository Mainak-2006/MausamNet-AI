import dotenv from 'dotenv';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  EventCategory,
  PrismaClient,
  ReportStatus,
  Role,
  Severity,
  SourceType,
  SyncLocationLevel,
} from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const prisma = new PrismaClient();

interface SampleLocation {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

interface SampleAlert {
  title: string;
  message: string;
  category: EventCategory;
  severity: Severity;
  city: string;
  state: string;
  hoursAgo: number;
  active: boolean;
}

const alertSamples: SampleAlert[] = [
  {
    title: 'Waterlogging on Hill Cart Road',
    message: 'Heavy rain caused knee-deep water on Hill Cart Road, traffic disrupted.',
    category: EventCategory.FLOOD,
    severity: Severity.HIGH,
    city: 'Siliguri',
    state: 'West Bengal',
    hoursAgo: 2,
    active: true,
  },
  {
    title: 'Torrential rain lashes South Mumbai',
    message: 'Heavy downpour with waterlogging in low lying areas of Mumbai.',
    category: EventCategory.HEAVY_RAINFALL,
    severity: Severity.SEVERE,
    city: 'Mumbai',
    state: 'Maharashtra',
    hoursAgo: 5,
    active: true,
  },
  {
    title: 'Cyclone storm surge expected near Puri coast',
    message: 'Strong winds and storm surge predicted along the Odisha coast.',
    category: EventCategory.CYCLONE,
    severity: Severity.CRITICAL,
    city: 'Puri',
    state: 'Odisha',
    hoursAgo: 30,
    active: false,
  },
  {
    title: 'Severe thunderstorm over Delhi NCR',
    message: 'Dark clouds, lightning and gusty winds across the region.',
    category: EventCategory.THUNDERSTORM,
    severity: Severity.MODERATE,
    city: 'Delhi',
    state: 'Delhi',
    hoursAgo: 24,
    active: false,
  },
  {
    title: 'Dense fog reduces visibility in Kolkata',
    message: 'Morning fog reduces visibility to under 100m in several areas.',
    category: EventCategory.FOG,
    severity: Severity.MODERATE,
    city: 'Kolkata',
    state: 'West Bengal',
    hoursAgo: 60,
    active: false,
  },
  {
    title: 'Landslide blocks highway near Siliguri',
    message: 'Landslide debris blocked traffic on the highway.',
    category: EventCategory.LANDSLIDE,
    severity: Severity.HIGH,
    city: 'Siliguri',
    state: 'West Bengal',
    hoursAgo: 72,
    active: false,
  },
];

interface Sample {
  category: EventCategory;
  title: string;
  description: string;
  severity: Severity;
  status: ReportStatus;
  credibilityScore: number;
  hoursAgo: number;
  location: SampleLocation;
  duplicateOfTitle?: string;
}

const samples: Sample[] = [
  {
    category: EventCategory.FLOOD,
    title: 'Waterlogging on Hill Cart Road',
    description: 'Heavy rain caused knee-deep water on Hill Cart Road, traffic disrupted.',
    severity: Severity.HIGH,
    status: ReportStatus.VERIFIED,
    credibilityScore: 87,
    hoursAgo: 2,
    location: { city: 'Siliguri', state: 'West Bengal', lat: 26.7271, lon: 88.3953 },
  },
  {
    category: EventCategory.FLOOD,
    title: 'Road flooded near Hill Cart Road station',
    description: 'Flood water near the station area, vehicles stranded.',
    severity: Severity.HIGH,
    status: ReportStatus.PENDING,
    credibilityScore: 74,
    hoursAgo: 1,
    location: { city: 'Siliguri', state: 'West Bengal', lat: 26.7272, lon: 88.3955 },
    duplicateOfTitle: 'Waterlogging on Hill Cart Road',
  },
  {
    category: EventCategory.HEAVY_RAINFALL,
    title: 'Torrential rain lashes South Mumbai',
    description: 'Heavy downpour with waterlogging in low lying areas of Mumbai.',
    severity: Severity.SEVERE,
    status: ReportStatus.VERIFIED,
    credibilityScore: 91,
    hoursAgo: 5,
    location: { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  },
  {
    category: EventCategory.CYCLONE,
    title: 'Cyclone storm surge expected near Puri coast',
    description: 'Strong winds and storm surge predicted along the Odisha coast.',
    severity: Severity.CRITICAL,
    status: ReportStatus.SUSPICIOUS,
    credibilityScore: 45,
    hoursAgo: 8,
    location: { city: 'Puri', state: 'Odisha', lat: 19.8135, lon: 85.8312 },
  },
  {
    category: EventCategory.THUNDERSTORM,
    title: 'Severe thunderstorm over Delhi NCR',
    description: 'Dark clouds, lightning and gusty winds across the region.',
    severity: Severity.MODERATE,
    status: ReportStatus.VERIFIED,
    credibilityScore: 80,
    hoursAgo: 12,
    location: { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  },
  {
    category: EventCategory.HEATWAVE,
    title: 'Scorching heatwave grips Rajasthan',
    description: 'Temperatures crossing 45C in Jaipur and surrounding areas.',
    severity: Severity.SEVERE,
    status: ReportStatus.PENDING,
    credibilityScore: 66,
    hoursAgo: 26,
    location: { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  },
  {
    category: EventCategory.FOG,
    title: 'Dense fog reduces visibility in Kolkata',
    description: 'Morning fog reduces visibility to under 100m in several areas.',
    severity: Severity.MODERATE,
    status: ReportStatus.VERIFIED,
    credibilityScore: 78,
    hoursAgo: 30,
    location: { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  },
  {
    category: EventCategory.HEAVY_RAINFALL,
    title: 'Cloudburst-like rains in Bengaluru',
    description: 'Sudden intense rainfall flooded underpasses in Bengaluru.',
    severity: Severity.HIGH,
    status: ReportStatus.PENDING,
    credibilityScore: 58,
    hoursAgo: 3,
    location: { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  },
  {
    category: EventCategory.HEAVY_RAINFALL,
    title: 'Underpass submerged after Bengaluru rains',
    description: 'Underpass flooded after cloudburst-like rains in the city.',
    severity: Severity.HIGH,
    status: ReportStatus.PENDING,
    credibilityScore: 55,
    hoursAgo: 3,
    location: { city: 'Bengaluru', state: 'Karnataka', lat: 12.972, lon: 77.595 },
    duplicateOfTitle: 'Cloudburst-like rains in Bengaluru',
  },
  {
    category: EventCategory.STRONG_WIND,
    title: 'Gusty winds uproot trees in Hyderabad',
    description: 'Strong winds damaged trees and hoardings in the city.',
    severity: Severity.MODERATE,
    status: ReportStatus.VERIFIED,
    credibilityScore: 73,
    hoursAgo: 40,
    location: { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  },
  {
    category: EventCategory.LANDSLIDE,
    title: 'Landslide blocks highway near Siliguri',
    description: 'Landslide debris blocked traffic on the highway.',
    severity: Severity.HIGH,
    status: ReportStatus.PENDING,
    credibilityScore: 69,
    hoursAgo: 20,
    location: { city: 'Siliguri', state: 'West Bengal', lat: 26.71, lon: 88.37 },
  },
  {
    category: EventCategory.DENSE_FOG,
    title: 'Dense fog hits Delhi flight schedule',
    description: 'Flights delayed due to thick fog cover.',
    severity: Severity.HIGH,
    status: ReportStatus.SUSPICIOUS,
    credibilityScore: 44,
    hoursAgo: 50,
    location: { city: 'Delhi', state: 'Delhi', lat: 28.62, lon: 77.22 },
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const existing = await prisma.profile.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });
    if (existing && existing.role === Role.USER) {
      await prisma.profile.update({
        where: { id: existing.id },
        data: { role: Role.ADMIN },
      });
      console.log(`Promoted ${adminEmail} to ADMIN`);
    } else if (existing) {
      console.log(`${adminEmail} is already ${existing.role}`);
    } else {
      console.log(
        `No profile found for ${adminEmail}. Sign in once with this email, then re-run seed to promote to ADMIN.`,
      );
    }
  }

  const sources = [
    { name: 'IMD', type: SourceType.IMD, reliabilityScore: 95 },
    { name: 'OpenWeather', type: SourceType.OPENWEATHER, reliabilityScore: 85 },
    { name: 'WeatherAPI', type: SourceType.WEATHERAPI, reliabilityScore: 82 },
    { name: 'Citizen Reports', type: SourceType.CITIZEN, reliabilityScore: 70 },
    { name: 'News / Internet', type: SourceType.NEWS, reliabilityScore: 75 },
  ];
  for (const s of sources) {
    await prisma.dataSource.upsert({
      where: { id: s.name.toLowerCase().replace(/\s+/g, '-') },
      create: { id: s.name.toLowerCase().replace(/\s+/g, '-'), ...s },
      update: { reliabilityScore: s.reliabilityScore },
    });
  }
  console.log('Seeded data sources');

  const locationsPath = path.resolve(
    process.cwd(),
    'src/weather/data/india-locations.json',
  );
  const locations = JSON.parse(readFileSync(locationsPath, 'utf-8')) as {
    districts: Array<{
      id: string;
      name: string;
      state: string;
      latitude: number | null;
      longitude: number | null;
      coordinateSource?: string;
    }>;
    majorCities: Array<{
      id: string;
      name: string;
      state: string;
      latitude: number | null;
      longitude: number | null;
      population?: number;
    }>;
  };

  const chunk = async <T,>(items: T[], size: number, fn: (item: T) => Promise<void>) => {
    for (let i = 0; i < items.length; i += size) {
      await Promise.all(items.slice(i, i + size).map((item) => fn(item)));
    }
  };

  let synced = 0;
  await chunk(locations.districts, 50, async (d) => {
    if (d.latitude == null || d.longitude == null) return;
    await prisma.syncLocation.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        name: d.name,
        state: d.state,
        type: SyncLocationLevel.DISTRICT,
        latitude: d.latitude,
        longitude: d.longitude,
        coordinateSource: d.coordinateSource,
      },
      update: {
        name: d.name,
        state: d.state,
        latitude: d.latitude,
        longitude: d.longitude,
        coordinateSource: d.coordinateSource,
      },
    });
    synced++;
  });
  await chunk(locations.majorCities, 50, async (c) => {
    if (c.latitude == null || c.longitude == null) return;
    await prisma.syncLocation.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        state: c.state,
        type: SyncLocationLevel.CITY,
        latitude: c.latitude,
        longitude: c.longitude,
        population: c.population,
      },
      update: {
        name: c.name,
        state: c.state,
        latitude: c.latitude,
        longitude: c.longitude,
        population: c.population,
      },
    });
    synced++;
  });
  console.log(`Seeded ${synced} sync locations (districts + major cities)`);

  if (process.env.SEED_DEMO_REPORTS !== 'true') {
    console.log('Skipping demo reports (set SEED_DEMO_REPORTS=true to seed them)');
    return;
  }

  const created = new Map<string, string>();
  for (const sample of samples) {
    const reportedAt = new Date(Date.now() - sample.hoursAgo * 60 * 60 * 1000);
    const duplicateOfId = sample.duplicateOfTitle
      ? created.get(sample.duplicateOfTitle)
      : null;
    const report = await prisma.report.create({
      data: {
        title: sample.title,
        description: sample.description,
        category: sample.category,
        severity: sample.severity,
        status: sample.status,
        city: sample.location.city,
        state: sample.location.state,
        latitude: sample.location.lat,
        longitude: sample.location.lon,
        reportedAt,
        source: SourceType.CITIZEN,
        aiPrediction: sample.category,
        aiConfidence: sample.status === ReportStatus.SUSPICIOUS ? 0.52 : 0.9,
        credibilityScore: sample.credibilityScore,
        isDuplicate: !!duplicateOfId,
        duplicateOfId,
        verifiedAt:
          sample.status === ReportStatus.VERIFIED ? reportedAt : undefined,
      },
    });
    created.set(sample.title, report.id);
  }
  console.log(`Seeded ${samples.length} demo reports`);

  for (const sample of alertSamples) {
    const exists = await prisma.alert.findFirst({
      where: { title: sample.title },
    });
    if (exists) continue;
    const startAt = new Date(Date.now() - sample.hoursAgo * 60 * 60 * 1000);
    await prisma.alert.create({
      data: {
        title: sample.title,
        message: sample.message,
        category: sample.category,
        severity: sample.severity,
        city: sample.city,
        state: sample.state,
        startAt,
        endAt: new Date(startAt.getTime() + 72 * 60 * 60 * 1000),
        isActive: sample.active,
        source: SourceType.CITIZEN,
      },
    });
  }
  console.log(`Seeded ${alertSamples.length} demo alerts`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());