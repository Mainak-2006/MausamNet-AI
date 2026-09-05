'use client';

import Link from 'next/link';
import { eventTagColor } from '../../lib/format';
import type { Report, Verification } from '../../lib/api/types';

function statusLabel(status: Verification['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ReportDetail({ report }: { report: Report }) {
  const color = eventTagColor(report.eventType);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
              style={{ color, backgroundColor: `${color}1a` }}
            >
              {report.eventType}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>
              {report.city}, {report.state}, {report.country}
            </span>
            <span>{new Date(report.reportDate).toLocaleString()}</span>
            {report.user && <span>By {report.user.name}</span>}
          </div>
          <p className="mt-5 whitespace-pre-wrap text-gray-800">{report.description}</p>
          {report.sourceUrl && (
            <a
              href={report.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm text-blue-600 hover:underline"
            >
              Source: {report.sourceUrl}
            </a>
          )}
        </section>

        {report.media && report.media.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Media ({report.media.length})
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {report.media.map((m) =>
                m.type === 'video' ? (
                  <video key={m.id} controls className="w-full rounded-lg">
                    <source src={m.url} />
                  </video>
                ) : (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={report.title}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ),
              )}
            </div>
          </section>
        )}

        {report.verifications && report.verifications.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Verification history</h2>
            <ul className="mt-4 divide-y divide-gray-200">
              {report.verifications.map((v) => (
                <li key={v.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{statusLabel(v.status)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {v.notes && <p className="mt-1 text-sm text-gray-600">{v.notes}</p>}
                  {v.user && (
                    <p className="mt-1 text-xs text-gray-400">by {v.user.name}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Credibility</h2>
          <p className="mt-2 text-4xl font-bold text-gray-900">
            {Math.round(report.credibilityScore * 100)}
            <span className="text-lg font-normal text-gray-400">/100</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">AI credibility score</p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Verification</h2>
          <p
            className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
              report.verificationStatus === 'verified'
                ? 'bg-green-100 text-green-800'
                : report.verificationStatus === 'suspicious'
                  ? 'bg-red-100 text-red-700'
                  : report.verificationStatus === 'unverified'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {statusLabel(report.verificationStatus)}
          </p>
          {report.isDuplicate && (
            <p className="mt-3 text-xs text-red-600">
              Flagged as duplicate
              {report.duplicateOfId && (
                <Link href={`/reports/${report.duplicateOfId}`} className="ml-1 underline">
                  (see original)
                </Link>
              )}
            </p>
          )}
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Location</h2>
          <p className="mt-2 text-sm text-gray-800">
            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Source: {report.source}</p>
        </section>
      </aside>
    </div>
  );
}