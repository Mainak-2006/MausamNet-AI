import Link from 'next/link';

const FEATURES = [
  {
    title: 'Interactive Map',
    description:
      'Explore weather events across India with color-coded markers and a live heatmap.',
    href: '/map',
  },
  {
    title: 'Community Reports',
    description:
      'Browse and filter verified citizen reports by event type, location, and date.',
    href: '/reports',
  },
  {
    title: 'AI Classification',
    description:
      'Submit a report and get instant AI event classification and credibility scoring.',
    href: '/reports/new',
  },
  {
    title: 'Severity Alerts',
    description:
      'Stay informed with severity-ranked alerts for active weather conditions.',
    href: '/alerts',
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          National Weather Big Data Analytics
          <span className="block text-blue-600">Platform for India</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
          Collect, classify, verify, and visualize weather events in real time
          — powered by AI and community reports.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Get started
          </Link>
          <Link
            href="/reports"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Browse reports
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}