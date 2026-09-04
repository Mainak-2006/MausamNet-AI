import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">MausamNet-AI</h1>
      <p className="max-w-md text-center text-gray-600">
        National Weather Big Data Analytics Platform — collecting, classifying,
        and verifying weather reports across India.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
