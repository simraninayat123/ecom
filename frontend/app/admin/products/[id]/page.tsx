'use client';
import { use, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AdminProduct,
  adminApi,
  ApiError,
  InventoryAdjustmentInput,
} from '../../../../lib/api';
import {
  ProductForm,
  ProductInput,
  mutationMessage,
} from '../../../../components/admin/product-form';
import { InventoryAdjustmentForm } from '../../../../components/admin/inventory-adjustment-form';
import { StatusBadge } from '../../../../components/admin/status-badge';
export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useSearchParams();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [message, setMessage] = useState(
    query.get('created')
      ? 'Product created. It has been queued for recommendation indexing.'
      : '',
  );
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const products = await adminApi<AdminProduct[]>('/admin/products');
      setProduct(products.find((item) => item.id === id) ?? null);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 503
          ? 'The service is temporarily unavailable. Please try again.'
          : 'Could not load this product.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(input: ProductInput) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi(`/admin/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      setMessage('Product updated. Recommendation indexing has been queued.');
      await load();
    } catch (cause) {
      setError(mutationMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function adjust(input: InventoryAdjustmentInput) {
    setInventorySaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi(`/admin/products/${id}/inventory`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setMessage('Stock updated immediately.');
      await load();
    } catch (cause) {
      setError(mutationMessage(cause));
    } finally {
      setInventorySaving(false);
    }
  }
  if (loading)
    return (
      <div className="admin-page">
        <p className="muted">Loading product...</p>
      </div>
    );
  if (!product)
    return (
      <div className="admin-page">
        <p className="admin-notice error">{error || 'Product not found.'}</p>
      </div>
    );
  return (
    <div className="admin-page narrow-admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue / {product.sku}</p>
          <h2>Edit product</h2>
          <div className="admin-inline-status">
            <StatusBadge
              value={product.active ? 'Active' : 'Inactive'}
              tone={product.active ? 'good' : 'bad'}
            />
            <StatusBadge
              value={product.published ? 'Published' : 'Unpublished'}
              tone={product.published ? 'good' : 'warn'}
            />
          </div>
        </div>
      </div>
      {message && (
        <p className="admin-notice success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}
      <ProductForm product={product} onSubmit={save} submitting={saving} />
      <section id="inventory" className="admin-panel admin-form-section">
        <p className="eyebrow">Inventory</p>
        <h3>Current stock: {product.stock}</h3>
        <p className="muted">Inventory changes are applied immediately.</p>
        <InventoryAdjustmentForm
          stock={product.stock}
          onSubmit={adjust}
          submitting={inventorySaving}
        />
      </section>
      {product.images?.length || product.variants?.length ? (
        <section className="admin-panel admin-form-section">
          <p className="eyebrow">Media and variants</p>
          {product.images?.map((image) => (
            <div className="admin-readonly-row" key={image.id}>
              <img src={image.url} alt={image.altText || product.name} />
              <span>{image.altText || image.url}</span>
            </div>
          ))}
          {product.variants?.map((variant) => (
            <div className="admin-readonly-row" key={variant.id}>
              <span>{variant.name}</span>
              <span>
                {variant.sku} / stock {variant.stock}
              </span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
