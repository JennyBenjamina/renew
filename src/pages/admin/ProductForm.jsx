import { useState } from 'react'
import { categories } from '../../data/products.js'
import { uploadProductImage, IMAGE_RULES } from '../../lib/products.js'

const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All')

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const empty = {
  name: '',
  slug: '',
  category: CATEGORY_OPTIONS[0] || 'Compounds',
  description: '',
  price: '',
  compare_at_price: '',
  purity: '',
  image_hue: 150,
  image_url: null,
  in_stock: true,
  featured: false,
  badges: [],
}

/** Add/edit modal. `product` is a full product to edit, or {} to create. */
export default function ProductForm({ product, existingIds, onSave, onClose }) {
  const isNew = !product?.id
  const [form, setForm] = useState({ ...empty, ...product })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const slug =
        (form.slug && slugify(form.slug)) || slugify(form.name) || 'item'
      const url = await uploadProductImage(file, slug)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const set = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const toggleBadge = (badge) => (e) => {
    setForm((f) => {
      const badges = new Set(f.badges || [])
      if (e.target.checked) badges.add(badge)
      else badges.delete(badge)
      return { ...f, badges: [...badges] }
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const slug = (form.slug && slugify(form.slug)) || slugify(form.name)
    if (!form.name.trim()) return setError('Name is required.')
    if (!slug) return setError('A slug (or name) is required.')
    if (form.price === '' || isNaN(Number(form.price)))
      return setError('A valid price is required.')

    const id = isNew ? slug : product.id
    if (isNew && existingIds.includes(id)) {
      return setError(`A product with slug “${slug}” already exists.`)
    }

    // Build the payload with correct types; omit id on update.
    const payload = {
      slug,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: Number(form.price),
      compare_at_price:
        form.compare_at_price === '' ? null : Number(form.compare_at_price),
      purity: form.purity.trim() || null,
      image_hue: Number(form.image_hue) || 150,
      image_url: form.image_url || null,
      in_stock: Boolean(form.in_stock),
      featured: Boolean(form.featured),
      badges: form.badges || [],
    }
    if (isNew) payload.id = id

    setSaving(true)
    try {
      await onSave(payload, isNew ? null : product.id)
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <div className="pform" role="dialog" aria-modal="true">
      <div className="pform__scrim" onClick={onClose} />
      <form className="pform__card" onSubmit={onSubmit}>
        <header className="pform__head">
          <h2>{isNew ? 'Add product' : 'Edit product'}</h2>
          <button type="button" className="pform__close" onClick={onClose}>
            ✕
          </button>
        </header>

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <div className="pform__grid">
          <label className="pform__full">
            Name
            <input value={form.name} onChange={set('name')} required />
          </label>

          <label>
            Slug {isNew ? '(auto from name if blank)' : ''}
            <input
              value={form.slug}
              onChange={set('slug')}
              disabled={!isNew}
              placeholder="auto"
            />
          </label>
          <label>
            Category
            <select value={form.category} onChange={set('category')}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="pform__full">
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={set('description')}
            />
          </label>

          <label>
            Price (USD)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={set('price')}
              required
            />
          </label>
          <label>
            Compare-at price (optional)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.compare_at_price ?? ''}
              onChange={set('compare_at_price')}
              placeholder="e.g. was-price for a sale"
            />
          </label>

          <label>
            Purity
            <input
              value={form.purity ?? ''}
              onChange={set('purity')}
              placeholder="99.9%"
            />
          </label>
          <label>
            Fallback art hue (0–360)
            <input
              type="number"
              min="0"
              max="360"
              value={form.image_hue}
              onChange={set('image_hue')}
            />
          </label>

          <div className="pform__full pform__image">
            <span className="pform__label-text">Product image</span>
            <div className="pform__image-row">
              <div className="pform__image-preview">
                {form.image_url ? (
                  <img src={form.image_url} alt="Product preview" />
                ) : (
                  <span className="pform__image-empty">No image</span>
                )}
              </div>
              <div className="pform__image-controls">
                <label className="btn btn--outline pform__upload">
                  {uploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}
                  <input
                    type="file"
                    accept={IMAGE_RULES.acceptAttr}
                    onChange={onPickImage}
                    disabled={uploading}
                    hidden
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    className="admin__link admin__link--danger"
                    onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                  >
                    Remove
                  </button>
                )}
                <p className="pform__hint">
                  Square image ({IMAGE_RULES.extensions}), at least{' '}
                  {IMAGE_RULES.minSize}×{IMAGE_RULES.minSize}px — {IMAGE_RULES.recommended}{' '}
                  recommended. Max {IMAGE_RULES.maxLabel}. If no image is set,
                  the fallback art hue above is used.
                </p>
              </div>
            </div>
          </div>

          <div className="pform__checks pform__full">
            <label className="pform__check">
              <input
                type="checkbox"
                checked={!!form.in_stock}
                onChange={set('in_stock')}
              />
              In stock
            </label>
            <label className="pform__check">
              <input
                type="checkbox"
                checked={!!form.featured}
                onChange={set('featured')}
              />
              Featured
            </label>
            <label className="pform__check">
              <input
                type="checkbox"
                checked={form.badges?.includes('new')}
                onChange={toggleBadge('new')}
              />
              “New” badge
            </label>
            <label className="pform__check">
              <input
                type="checkbox"
                checked={form.badges?.includes('sale')}
                onChange={toggleBadge('sale')}
              />
              “Sale” badge
            </label>
          </div>
        </div>

        <footer className="pform__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || uploading}
          >
            {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  )
}
