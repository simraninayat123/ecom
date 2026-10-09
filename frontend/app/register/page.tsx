'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, SELLER_NAME_KEY, SELLER_SLUG_KEY } from '../../lib/api';

type AuthResult = { accessToken: string };
type SellerOnboardingResult = AuthResult & {
  seller: { name: string; slug: string };
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [sellerError, setSellerError] = useState('');
  const [sellerLoading, setSellerLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<AuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      localStorage.setItem('morrow_access_token', result.accessToken);
      window.dispatchEvent(new Event('morrow-auth-changed'));
      router.push('/');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create account',
      );
    }
  }
  async function onboardSeller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSellerError('');
    setSellerLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<SellerOnboardingResult>(
        '/auth/seller-onboarding',
        {
          method: 'POST',
          body: JSON.stringify({
            sellerName: form.get('sellerName'),
            sellerSlug: form.get('sellerSlug'),
            ownerName: form.get('ownerName'),
            ownerEmail: form.get('ownerEmail'),
            ownerPassword: form.get('ownerPassword'),
          }),
        },
      );
      localStorage.setItem('morrow_access_token', result.accessToken);
      localStorage.setItem(SELLER_SLUG_KEY, result.seller.slug);
      localStorage.setItem(SELLER_NAME_KEY, result.seller.name);
      window.dispatchEvent(new Event('morrow-auth-changed'));
      router.push('/admin');
    } catch (cause) {
      setSellerError(
        cause instanceof Error ? cause.message : 'Unable to create seller',
      );
    } finally {
      setSellerLoading(false);
    }
  }
  return (
    <div className="page auth-layout">
      <section className="auth-panel">
        <p className="eyebrow">Shopper account</p>
        <h1>Create your account</h1>
        <p className="muted">
          Use this account to manage your demo cart and orders.
        </p>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" minLength={2} required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          {error && <p className="notice">{error}</p>}
          <button>Create account</button>
        </form>
        <p>
          Already registered? <Link href="/login">Sign in</Link>.
        </p>
      </section>
      <section className="auth-panel auth-panel-seller">
        <p className="eyebrow">Start selling</p>
        <h2>Create a seller store</h2>
        <p className="muted">Set up your storefront and become its owner.</p>
        <form onSubmit={onboardSeller}>
          <label>
            Store name
            <input name="sellerName" minLength={2} required />
          </label>
          <label>
            Store slug
            <input
              name="sellerSlug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="acme-store"
              required
            />
          </label>
          <label>
            Owner name
            <input name="ownerName" minLength={2} required />
          </label>
          <label>
            Owner email
            <input name="ownerEmail" type="email" required />
          </label>
          <label>
            Password
            <input
              name="ownerPassword"
              type="password"
              minLength={8}
              required
            />
          </label>
          {sellerError && <p className="notice">{sellerError}</p>}
          <button disabled={sellerLoading}>
            {sellerLoading ? 'Creating store...' : 'Create seller store'}
          </button>
        </form>
      </section>
    </div>
  );
}
