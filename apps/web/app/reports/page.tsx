import { Suspense } from 'react';
import ReportsBrowser from '@/components/ReportsBrowser';

export const metadata = { title: 'Reports | MausamNet-AI' };

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-slate-400">
          Loading reports…
        </div>
      }
    >
      <ReportsBrowser />
    </Suspense>
  );
}