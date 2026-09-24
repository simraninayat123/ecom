'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

type AuthResult = { accessToken: string };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      localStorage.setItem('morrow_access_token', result.accessToken);
      window.dispatchEvent(new Event('morrow-auth-changed'));
      router.push('/');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in'); }
  }
  return <div className="page narrow"><h1>Welcome back</h1><p className="muted">Sign in to save your cart and check out.</p><form onSubmit={submit}><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength={8} required /></label>{error && <p className="notice">{error}</p>}<button>Sign in</button></form><p>New to Morrow? <Link href="/register">Create an account</Link>.</p></div>;
}
