import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  adminListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/products.js'
import { money } from '../../lib/format.js'
import Logo from '../../components/Logo.jsx'
import ProductForm from './ProductForm.jsx'
import './admin.css'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // product object, {} for new, or null
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setProducts(await adminListProducts())
    } catch (err) {
      setError(err.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSave = async (values, id) => {
    if (id) {
      const updated = await updateProduct(id, values)
      setProducts((list) => list.map((p) => (p.id === id ? updated : p)))
    } else {
      const created = await createProduct(values)
      setProducts((list) => [created, ...list])
    }
    setEditing(null)
  }

  const onDelete = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return
    setBusyId(product.id)
    try {
      await deleteProduct(product.id)
      setProducts((list) => list.filter((p) => p.id !== product.id))
    } catch (err) {
      alert(err.message || 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  const toggle = async (product, field) => {
    setBusyId(product.id)
    try {
      const updated = await updateProduct(product.id, { [field]: !product[field] })
      setProducts((list) => list.map((p) => (p.id === product.id ? updated : p)))
    } catch (err) {
      alert(err.message || 'Update failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__bar-left">
          <Logo />
          <span className="adminlogin__tag">Admin</span>
        </div>
        <div className="admin__bar-right">
          <Link to="/" className="admin__link">
            View store ↗
          </Link>
          <span className="admin__user">{user?.email}</span>
          <button className="btn btn--outline admin__signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="admin__main">
        <div className="admin__head">
          <div>
            <h1>Products</h1>
            <p>{products.length} item{products.length === 1 ? '' : 's'} in the catalog.</p>
          </div>
          <div className="admin__head-actions">
            <button className="btn btn--outline" onClick={load} disabled={loading}>
              Refresh
            </button>
            <button className="btn btn--primary" onClick={() => setEditing({})}>
              + Add product
            </button>
          </div>
        </div>

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        {loading ? (
          <p className="admin__empty">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="admin__empty">No products yet. Add your first one.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Purity</th>
                  <th>In stock</th>
                  <th>Featured</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={busyId === p.id ? 'is-busy' : ''}>
                    <td>
                      <strong>{p.name}</strong>
                      <span className="admin__slug">{p.slug}</span>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      {money(p.price)}
                      {p.compare_at_price && (
                        <span className="admin__was">{money(p.compare_at_price)}</span>
                      )}
                    </td>
                    <td>{p.purity || '—'}</td>
                    <td>
                      <button
                        className={`admin__toggle ${p.in_stock ? 'is-on' : ''}`}
                        onClick={() => toggle(p, 'in_stock')}
                        disabled={busyId === p.id}
                        aria-pressed={p.in_stock}
                      >
                        {p.in_stock ? 'In stock' : 'Out'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`admin__toggle ${p.featured ? 'is-on' : ''}`}
                        onClick={() => toggle(p, 'featured')}
                        disabled={busyId === p.id}
                        aria-pressed={p.featured}
                      >
                        {p.featured ? 'Featured' : 'No'}
                      </button>
                    </td>
                    <td className="admin__row-actions">
                      <button className="admin__link" onClick={() => setEditing(p)}>
                        Edit
                      </button>
                      <button
                        className="admin__link admin__link--danger"
                        onClick={() => onDelete(p)}
                        disabled={busyId === p.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editing !== null && (
        <ProductForm
          product={editing}
          existingIds={products.map((p) => p.id)}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
