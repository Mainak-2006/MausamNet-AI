'use client';

import { useEffect, useState } from 'react';
import { apiPost } from '../../lib/api';
import type {
  ClassificationResult,
  CredibilityResult,
} from '../../lib/api/types';

interface ReviewStepProps {
  title: string;
  description: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  eventType: string;
  reportDate: string;
}

export default function ReviewStep({
  title,
  description,
  city,
  state,
  lat,
  lng,
  eventType,
  reportDate,
}: ReviewStepProps) {
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [credibility, setCredibility] = useState<CredibilityResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  const canAnalyze = description.length >= 10;

  useEffect(() => {
    if (!canAnalyze) return;
    let active = true;

    Promise.all([
      apiPost<ClassificationResult>('/api/classification', { text: description }),
      apiPost<CredibilityResult>('/api/credibility', {
        text: description,
        source: 'citizen',
        hasMedia: false,
        hasLocation: lat !== null && lng !== null,
      }),
    ])
      .then(([cls, cred]) => {
        if (!active) return;
        setClassification(cls);
        setCredibility(cred);
      })
      .catch((err) => {
        if (active) setAiError((err as { message?: string }).message ?? 'AI preview failed');
      })
      .finally(() => {
        if (active) setPending(false);
      });

    return () => {
      active = false;
    };
  }, [canAnalyze, description, lat, lng]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Title</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">{title || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Event type</dt>
            <dd className="mt-1 text-sm capitalize text-gray-900">{eventType || 'Auto-classified'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Location</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {city || '—'}, {state || '—'}
              {lat !== null && lng !== null && (
                <span className="text-gray-500">
                  {' '}
                  ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Report date</dt>
            <dd className="mt-1 text-sm text-gray-900">{reportDate || '—'}</dd>
          </div>
        </dl>
        <div>
          <dt className="mt-4 text-xs font-medium text-gray-500">Description</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{description}</dd>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">AI classification preview</h3>
        {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
        {canAnalyze && pending && <p className="mt-2 text-sm text-gray-500">Analyzing…</p>}
        {!pending && classification && (
          <div className="mt-3">
            <p className="text-sm capitalize text-gray-800">
              Predicted type:{' '}
              <span className="font-semibold">{classification.eventType}</span> (confidence{' '}
              {(classification.confidence * 100).toFixed(0)}%)
            </p>
          </div>
        )}
        {!canAnalyze && (
          <p className="mt-2 text-sm text-gray-500">
            Add at least 10 characters of description for an AI preview.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">Credibility preview</h3>
        {canAnalyze && pending && <p className="mt-2 text-sm text-gray-500">Scoring…</p>}
        {!pending && credibility && (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${credibility.score * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {(credibility.score * 100).toFixed(0)}/100
              </span>
            </div>
          </div>
        )}
        {!canAnalyze && (
          <p className="mt-2 text-sm text-gray-500">
            Credibility will be computed after submission.
          </p>
        )}
      </div>
    </div>
  );
}