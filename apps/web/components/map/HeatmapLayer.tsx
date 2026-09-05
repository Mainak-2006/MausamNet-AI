'use client';

import 'leaflet.heat';
import L, { type HeatLatLngTuple } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { Report } from '../../lib/api/types';

export default function HeatmapLayer({
  reports,
  enabled,
}: {
  reports: Report[];
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return undefined;

    const points: HeatLatLngTuple[] = reports
      .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
      .map((r) => [r.latitude, r.longitude, 1]);

    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
    });
    layer.addTo(map);

    return () => {
      layer.remove();
    };
  }, [reports, enabled, map]);

  return null;
}