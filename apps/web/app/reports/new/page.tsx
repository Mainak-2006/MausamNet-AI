'use client';

import AuthGuard from '../../../components/auth/AuthGuard';
import ReportForm from '../../../components/submit/ReportForm';

export default function NewReportPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit a weather report</h1>
          <p className="text-sm text-gray-500">
            Report a weather event. AI will classify it and score its credibility.
          </p>
        </div>
        <ReportForm />
      </div>
    </AuthGuard>
  );
}