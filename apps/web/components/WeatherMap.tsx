'use client';

// Leaflet ships CSS without TypeScript declarations; Next.js handles this side-effect import.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Report } from '@/lib/types';
import { categoryStyle, timeAgo } from '@/lib/constants';
import { StatusBadge, SeverityBadge } from './badges';

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function buildIcon(category: string, verified: boolean) {
  const emoji = categoryStyle(category).emoji;
  const ring = verified ? 'border-emerald-500' : 'border-amber-500';
  const html = `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-lg ring-2 ${ring}" style="border:2px solid white">${emoji}</div>`;
  return L.divIcon({
    html,
    className: 'bg-transparent border-0',
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -34],
  });
}

interface WeatherMapProps {
  reports: Report[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

export default function WeatherMap({
  reports,
  height = '70vh',
  center = [22.5, 79],
  zoom = 5,
}: WeatherMapProps) {
  const markers = useMemo(
    () => reports.filter((r) => r.latitude != null && r.longitude != null),
    [reports],
  );

  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const r of markers) {
      const key = `${r.category}-${r.status === 'VERIFIED'}`;
      if (!map.has(key)) map.set(key, buildIcon(r.category, r.status === 'VERIFIED'));
    }
    return map;
  }, [markers]);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height, width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={TILE_URL}
        />
        {markers.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude!, report.longitude!]}
            icon={icons.get(`${report.category}-${report.status === 'VERIFIED'}`)}
          >
            <Popup>
              <div className="w-56 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {categoryStyle(report.category).label} ·{' '}
                    {report.severity}
                  </span>
                  <StatusBadge status={report.status} />
                </div>
                <p className="font-medium text-slate-800">{report.title}</p>
                <p className="text-xs text-slate-500">
                  {[report.city, report.state].filter(Boolean).join(', ') ||
                    'Unknown'}{' '}
                  · {timeAgo(report.reportedAt)}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-xs">
                  <span>Credibility</span>
                  <span className="font-semibold">{report.credibilityScore}/100</span>
                  <SeverityBadge severity={report.severity} />
                </div>
                <div className="block rounded-lg bg-brand-600 px-2 py-1 text-center text-xs font-medium text-white">
                  <Link href={`/reports/${report.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}