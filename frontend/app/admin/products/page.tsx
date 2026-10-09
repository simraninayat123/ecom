'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AdminProduct,
  adminApi,
  ApiError,
  formatMoney,
} from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/confirm-dialog';
import { EmptyState } from '../../../components/admin/empty-state';
import { StatusBadge } from '../../../components/admin/status-badge';
type Filter =
  'all' | 'active' | 'inactive' | 'published' | 'unpublished' | 'low';
export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [remove, setRemove] = useState<AdminProduct | null>(null);
  const [removing, setRemoving] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setProducts(await adminApi<AdminProduct[]>('/admin/products'));
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 503
          ? 'The service is temporarily unavailable. Please try again.'
          : 'Could not load products.',
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const haystack =
          `${product.name} ${product.sku} ${product.category?.name ?? ''}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesFilter =
          filter === 'all' ||
          (filter === 'active' && product.active) ||
          (filter === 'inactive' && !product.active) ||
          (filter === 'published' && product.published) ||
          (filter === 'unpublished' && !product.published) ||
          (filter === 'low' && product.stock <= 5);
        return matchesSearch && matchesFilter;
      }),
    [products, search, filter],
  );
  async function deactivate() {
    if (!remove) return;
    setRemoving(true);
    try {
      await adminApi(`/admin/products/${remove.id}`, { method: 'DELETE' });
      setMessage('Product deactivated and removed from recommendation search.');
      setRemove(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 503
          ? 'The service is temporarily unavailable. Please try again.'
          : cause instanceof Error
            ? cause.message
            : 'Could not deactivate product.',
      );
    } finally {
      setRemoving(false);
    }
  }
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Products</h2>
          <p className="muted">{products.length} products in the catalogue.</p>
        </div>
        <Link className="admin-button" href="/admin/products/new">
          Add product
        </Link>
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
      <div className="admin-toolbar">
        <label className="admin-search">
          Search products
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, SKU, or category"
          />
        </label>
        <label>
          Filter
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="low">Low stock (5 or less)</option>
          </select>
        </label>
      </div>
      {loading ? (
        <p className="muted">Loading products...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching products"
          message={
            products.length
              ? 'Try changing the search or filter.'
              : 'Add a product to begin building the catalogue.'
          }
        />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={product.imageUrl} alt="" />
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.category?.name ?? 'Uncategorized'}</td>
                    <td>{formatMoney(product.price, product.currency)}</td>
                    <td className={product.stock <= 5 ? 'low-stock' : ''}>
                      {product.stock}
                    </td>
                    <td>
                      <StatusBadge
                        value={product.active ? 'Active' : 'Inactive'}
                        tone={product.active ? 'good' : 'bad'}
                      />
                      <StatusBadge
                        value={product.published ? 'Published' : 'Unpublished'}
                      />
                    </td>
                    <td>
                      {new Date(product.updatedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        <Link href={`/admin/products/${product.id}#inventory`}>
                          Stock
                        </Link>
                        {product.active && (
                          <button
                            className="text-danger"
                            onClick={() => setRemove(product)}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-mobile-list">
            {filtered.map((product) => (
              <article className="admin-mobile-product" key={product.id}>
                <div className="admin-product-cell">
                  <img src={product.imageUrl} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted">
                      {product.sku} ·{' '}
                      {product.category?.name ?? 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div className="admin-mobile-meta">
                  <span>{formatMoney(product.price, product.currency)}</span>
                  <span className={product.stock <= 5 ? 'low-stock' : ''}>
                    Stock {product.stock}
                  </span>
                </div>
                <div className="admin-row-actions">
                  <Link href={`/admin/products/${product.id}`}>Edit</Link>
                  <Link href={`/admin/products/${product.id}#inventory`}>
                    Adjust stock
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {remove && (
        <ConfirmDialog
          title={`Deactivate ${remove.name}?`}
          message="This hides the product from customers and removes it from recommendation search."
          confirmLabel={removing ? 'Deactivating...' : 'Deactivate product'}
          onClose={() => {
            if (!removing) setRemove(null);
          }}
          onConfirm={() => void deactivate()}
        />
      )}
    </div>
  );
}
