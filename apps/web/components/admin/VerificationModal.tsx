'use client';

import { useState } from 'react';
import { VerificationStatus } from '@mausamnet/shared';
import { apiPost } from '../../lib/api';
import type { Report } from '../../lib/api/types';

interface VerificationModalProps {
  report: Report;
  onClose: () => void;
  onVerified: () => void;
}

export default function VerificationModal({
  report,
  onClose,
  onVerified,
}: VerificationModalProps) {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.VERIFIED);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/api/verification', {
        reportId: report.id,
        status,
        notes: notes || undefined,
      });
      onVerified();
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Verification failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Verify report</h2>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{report.title}</p>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VerificationStatus)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value={VerificationStatus.VERIFIED}>Verified</option>
              <option value={VerificationStatus.UNVERIFIED}>Unverified</option>
              <option value={VerificationStatus.SUSPICIOUS}>Suspicious</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this verification"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save verification'}
          </button>
        </div>
      </div>
    </div>
  );
}