'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';
import type { CreateReportDto, Report } from '../../lib/api/types';
import DetailsStep from './DetailsStep';
import LocationStep from './LocationStep';
import ReviewStep from './ReviewStep';

const STEPS = ['Details', 'Location', 'Review'];

export default function ReportForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CreateReportDto['eventType'] | ''>('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const canProceed =
    step === 0
      ? title.length >= 5 && description.length >= 10 && reportDate !== ''
      : step === 1
        ? city.length >= 2 && state.length >= 2
        : true;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const dto: CreateReportDto = {
      title,
      description,
      eventType: (eventType || 'other') as CreateReportDto['eventType'],
      reportDate: new Date(reportDate).toISOString(),
      city,
      state,
      country: 'India',
      latitude: lat ?? 20.5937,
      longitude: lng ?? 78.9629,
    };
    try {
      const report = await apiPost<Report>('/api/reports', dto);
      router.push(`/reports/${report.id}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Failed to submit report');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white'
                    : done
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span>{i + 1}</span>
                {label}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-gray-300" />}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <DetailsStep
          title={title}
          onTitle={setTitle}
          description={description}
          onDescription={setDescription}
          eventType={eventType}
          onEventType={setEventType}
          reportDate={reportDate}
          onReportDate={setReportDate}
        />
      )}
      {step === 1 && (
        <LocationStep
          city={city}
          onCity={setCity}
          state={state}
          onState={setState}
          lat={lat}
          lng={lng}
          onCoords={(latN, lngN) => {
            setLat(latN);
            setLng(lngN);
          }}
        />
      )}
      {step === 2 && (
        <ReviewStep
          title={title}
          description={description}
          city={city}
          state={state}
          lat={lat}
          lng={lng}
          eventType={eventType}
          reportDate={reportDate}
        />
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canProceed && setStep((s) => s + 1)}
            disabled={!canProceed}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        )}
      </div>
    </div>
  );
}