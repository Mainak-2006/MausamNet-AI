import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MausamNet-AI — National Weather Big Data Analytics Platform',
  description:
    'Collect, classify, verify, and visualize weather events across India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
