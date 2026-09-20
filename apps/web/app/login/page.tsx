import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Log in | MausamNet-AI' };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Suspense
        fallback={<div className="card p-8 text-center text-slate-400">Loading…</div>}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}