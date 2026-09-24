'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

type AuthResult = { accessToken: string };

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email'), password: form.get('password') }) });
      localStorage.setItem('morrow_access_token', result.accessToken);
      window.dispatchEvent(new Event('morrow-auth-changed'));
      router.push('/');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create account'); }
  }
  return <div className="page narrow"><h1>Create your account</h1><p className="muted">Use this account to manage your demo cart and orders.</p><form onSubmit={submit}><label>Name<input name="name" minLength={2} required /></label><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength={8} required /></label>{error && <p className="notice">{error}</p>}<button>Create account</button></form><p>Already registered? <Link href="/login">Sign in</Link>.</p></div>;
}
