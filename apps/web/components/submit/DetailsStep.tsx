'use client';

import type { WeatherEvent } from '@mausamnet/shared';

interface DetailsStepProps {
  title: string;
  onTitle: (value: string) => void;
  description: string;
  onDescription: (value: string) => void;
  eventType: WeatherEvent | '';
  onEventType: (value: WeatherEvent) => void;
  reportDate: string;
  onReportDate: (value: string) => void;
}

export default function DetailsStep({
  title,
  onTitle,
  description,
  onDescription,
  eventType,
  onEventType,
  reportDate,
  onReportDate,
}: DetailsStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          minLength={5}
          maxLength={500}
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="e.g. Heavy flooding in Chennai suburbs"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          required
          minLength={10}
          rows={6}
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Describe the weather event — what happened, when, and its impact."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
            Event type
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => onEventType(e.target.value as WeatherEvent)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select (AI will classify)</option>
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
          <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700">
            Report date *
          </label>
          <input
            id="reportDate"
            type="date"
            required
            value={reportDate}
            onChange={(e) => onReportDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}