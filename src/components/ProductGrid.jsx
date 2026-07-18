import ProductCard from './ProductCard.jsx'
import './ProductGrid.css'

export default function ProductGrid({ products }) {
  if (!products?.length) {
    return <p className="grid__empty">No products found.</p>
  }
  return (
    <div className="pgrid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
