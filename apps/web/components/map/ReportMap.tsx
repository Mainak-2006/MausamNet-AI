'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { eventTagColor } from '../../lib/format';
import type { Report } from '../../lib/api/types';
import HeatmapLayer from './HeatmapLayer';

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, Math.max(map.getZoom(), 10), { duration: 0.5 });
    }
  }, [center, map]);
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points);
    }
  }, [points, map]);
  return null;
}

export default function ReportMap({
  reports,
  center,
  heatmap,
}: {
  reports: Report[];
  center: [number, number] | null;
  heatmap: boolean;
}) {
  const points = reports
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => [r.latitude, r.longitude] as [number, number]);

  return (
    <MapContainer
      center={center ?? [20.5937, 78.9629]}
      zoom={5}
      className="h-[520px] w-full rounded-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      <HeatmapLayer reports={reports} enabled={heatmap} />
      {points.length > 1 && <FitBounds points={points} />}
      {reports.map((report) => {
        if (
          !Number.isFinite(report.latitude) ||
          !Number.isFinite(report.longitude)
        ) {
          return null;
        }
        const color = eventTagColor(report.eventType);
        return (
          <CircleMarker
            key={report.id}
            center={[report.latitude, report.longitude]}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
          >
            <Popup>
              <div className="min-w-[10rem]">
                <p className="font-semibold">{report.title}</p>
                <p className="text-xs">
                  {report.city}, {report.state}
                </p>
                <p className="mt-1 text-xs capitalize">
                  {report.eventType} · {report.verificationStatus}
                </p>
                <p className="text-xs text-gray-500">
                  Credibility: {Math.round(report.credibilityScore * 100)}/100
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}