'use client';

interface LocationStepProps {
  city: string;
  onCity: (value: string) => void;
  state: string;
  onState: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onCoords: (lat: number | null, lng: number | null) => void;
}

export default function LocationStep({
  city,
  onCity,
  state,
  onState,
  lat,
  lng,
  onCoords,
}: LocationStepProps) {
  const handleLat = (value: string) => {
    const n = Number(value);
    onCoords(Number.isFinite(n) && n >= -90 && n <= 90 ? n : null, lng);
  };
  const handleLng = (value: string) => {
    const n = Number(value);
    onCoords(lat, Number.isFinite(n) && n >= -180 && n <= 180 ? n : null);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City *
          </label>
          <input
            id="city"
            type="text"
            required
            minLength={2}
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder="e.g. Chennai"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State *
          </label>
          <input
            id="state"
            type="text"
            required
            minLength={2}
            value={state}
            onChange={(e) => onState(e.target.value)}
            placeholder="e.g. Tamil Nadu"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Coordinates (optional)</p>
        <p className="mt-1 text-xs text-gray-500">
          Provide latitude/longitude for a precise map location.
        </p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lat" className="block text-xs font-medium text-gray-500">
              Latitude
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              value={lat ?? ''}
              onChange={(e) => handleLat(e.target.value)}
              placeholder="e.g. 13.0827"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-xs font-medium text-gray-500">
              Longitude
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              value={lng ?? ''}
              onChange={(e) => handleLng(e.target.value)}
              placeholder="e.g. 80.2707"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}