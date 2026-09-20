'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Cloud, Menu, X } from 'lucide-react';
import { useAuth } from './AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Live Map' },
  { href: '/reports', label: 'Reports' },
  { href: '/weather', label: 'Weather' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Cloud size={20} />
          </span>
          <span className="text-lg font-bold text-slate-900">
            MausamNet
            <span className="text-brand-600">-AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <Link
                href="/report/new"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                + Report
              </Link>
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </Link>
              {user.role !== 'USER' && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive('/admin')
                      ? 'bg-red-50 text-red-700'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <span className="text-sm text-slate-400">…</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-700"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                </span>
                {user.name ?? user.email.split('@')[0]}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/report/new"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white"
                >
                  + Report
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                {user.role !== 'USER' && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="rounded-lg px-3 py-2 text-left text-sm text-slate-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}