'use client';

interface MapFiltersProps {
  eventType: string;
  onEventType: (value: string) => void;
  city: string;
  onCity: (value: string) => void;
  heatmap: boolean;
  onHeatmap: (value: boolean) => void;
}

export default function MapFilters({
  eventType,
  onEventType,
  city,
  onCity,
  heatmap,
  onHeatmap,
}: MapFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs font-medium text-gray-500">Event type</label>
        <select
          value={eventType}
          onChange={(e) => onEventType(e.target.value)}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All event types</option>
          <option value="rainfall">Rainfall</option>
          <option value="flood">Flood</option>
          <option value="thunderstorm">Thunderstorm</option>
          <option value="heatwave">Heatwave</option>
          <option value="strong_wind">Strong wind</option>
          <option value="cyclone">Cyclone</option>
          <option value="drought">Drought</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          placeholder="e.g. Chennai"
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={heatmap}
          onChange={(e) => onHeatmap(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        Heatmap
      </label>
    </div>
  );
}