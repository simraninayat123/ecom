'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminApi } from '../../../../lib/api';
import {
  mutationMessage,
  ProductForm,
  ProductInput,
} from '../../../../components/admin/product-form';
export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(input: ProductInput) {
    setSaving(true);
    setError('');
    try {
      const product = await adminApi<{ id: string }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      router.push(`/admin/products/${product.id}?created=1`);
    } catch (cause) {
      setError(mutationMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="admin-page narrow-admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Add product</h2>
          <p className="muted">
            New products are queued for recommendation indexing after creation.
          </p>
        </div>
      </div>
      <ProductForm onSubmit={submit} submitting={saving} error={error} />
    </div>
  );
}
