'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-slate-600">
            We hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}