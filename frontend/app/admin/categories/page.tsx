'use client';
import { FormEvent, useEffect, useState } from 'react';
import { AdminCategory, adminApi, ApiError } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/confirm-dialog';
import { EmptyState } from '../../../components/admin/empty-state';
export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  async function load() {
    setLoading(true);
    try {
      setCategories(await adminApi<AdminCategory[]>('/admin/categories'));
    } catch {
      setError('Could not load categories.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function beginEdit(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
    });
    setError('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminApi(
        editing ? `/admin/categories/${editing.id}` : '/admin/categories',
        { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(form) },
      );
      setMessage(editing ? 'Category updated.' : 'Category created.');
      setForm({ name: '', slug: '', description: '' });
      setEditing(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Could not save category.',
      );
    }
  }
  async function remove() {
    if (!deleting) return;
    try {
      await adminApi(`/admin/categories/${deleting.id}`, { method: 'DELETE' });
      setMessage('Category deleted.');
      setDeleting(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not delete category.',
      );
    }
  }
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue structure</p>
          <h2>Categories</h2>
          <p className="muted">
            Organize products without losing the simple storefront taxonomy.
          </p>
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
      <div className="admin-section-grid categories-layout">
        <section className="admin-panel">
          <p className="eyebrow">
            {editing ? 'Edit category' : 'New category'}
          </p>
          <h3>{editing ? editing.name : 'Add a category'}</h3>
          <form className="admin-form" onSubmit={submit}>
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm({ ...form, slug: event.target.value })
                }
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={4}
              />
            </label>
            <div className="admin-row-actions">
              <button className="admin-button">
                {editing ? 'Save category' : 'Create category'}
              </button>
              {editing && (
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: '', slug: '', description: '' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="admin-panel">
          <p className="eyebrow">Current categories</p>
          {loading ? (
            <p className="muted">Loading categories...</p>
          ) : categories.length === 0 ? (
            <EmptyState title="No categories yet" />
          ) : (
            <div className="admin-category-list">
              {categories.map((category) => (
                <div className="admin-category-row" key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <span className="muted">
                      /{category.slug} · {category._count?.products ?? 0}{' '}
                      products
                    </span>
                    {category.description && <p>{category.description}</p>}
                  </div>
                  <div className="admin-row-actions">
                    <button onClick={() => beginEdit(category)}>Edit</button>
                    <button
                      className="text-danger"
                      onClick={() => setDeleting(category)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="Only delete a category when its products can be left uncategorized."
          confirmLabel="Delete category"
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
