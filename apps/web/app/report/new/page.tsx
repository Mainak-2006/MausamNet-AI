import ReportForm from '@/components/ReportForm';

export const metadata = { title: 'Submit report | MausamNet-AI' };

export default function NewReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Submit a weather report</h1>
      <p className="mb-6 text-sm text-slate-500">
        Report weather events happening around you — floods, rainfall, storms,
        heatwaves and more.
      </p>
      <ReportForm />
    </div>
  );
}