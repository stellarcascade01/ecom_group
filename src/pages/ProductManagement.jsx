import React, { useState, useEffect, useCallback } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function ProductManagement({ currentUser, onNavigate }){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [success, setSuccess] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const res = await fetch('https://ecom-group.onrender.com/api/products')
      if(!res.ok) throw new Error('Failed to fetch products')
      const allProducts = await res.json()
      const producerName = currentUser?.name || currentUser?.email
      const filtered = allProducts.filter(p => p.producer === producerName)
      setProducts(filtered)
    }catch(err){
      setError(err.message || t('failedToLoadProducts'))
    }finally{
      setLoading(false)
    }
  }, [currentUser, t])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function startEdit(product){
    setEditingId(product.id || product._id)
    setEditForm({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock || 0,
      description: product.description
    })
  }

  async function handleSaveEdit(){
    if(!editingId) return
    setError('')
    try{
      const res = await fetch(`https://ecom-group.onrender.com/api/products/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || 'guest',
          'X-User-Id': currentUser?.id || currentUser?._id || ''
        },
        body: JSON.stringify(editForm)
      })
      if(!res.ok) throw new Error('Failed to update product')
      const updated = await res.json()
      setProducts(prev => prev.map(p => (p.id === editingId || p._id === editingId) ? { ...p, ...updated } : p))
      setEditingId(null)
      setSuccess(t('updated'))
      setTimeout(() => setSuccess(''), 3000)
    }catch(err){
      setError(err.message || 'Failed to update product')
    }
  }

  async function handleDelete(productId){
    if(!window.confirm(t('confirmDelete'))) return
    setError('')
    try{
      const res = await fetch(`https://ecom-group.onrender.com/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Role': currentUser?.role || 'guest',
          'X-User-Id': currentUser?.id || currentUser?._id || ''
        }
      })
      if(!res.ok) throw new Error('Failed to delete product')
      setProducts(prev => prev.filter(p => (p.id || p._id) !== productId))
      setSuccess(t('deleted'))
      setTimeout(() => setSuccess(''), 3000)
    }catch(err){
      setError(err.message || 'Failed to delete product')
    }
  }

  return (
    <main className="page product-mgmt-page" aria-labelledby="mgmt-title">
      <section className="header-bar">
        <div>
          <h1 id="mgmt-title">{t('myProducts')}</h1>
          <p className="subtitle">{t('manageProductsSubtitle')}</p>
        </div>
        <div className="header-actions">
          <Button onClick={()=>onNavigate && onNavigate('upload-product')}>{t('addNewProduct')}</Button>
          <Button variant="outline" onClick={()=>onNavigate && onNavigate('producer-dashboard')}>{t('back')}</Button>
        </div>
      </section>

      {error && <div className="banner error" role="alert">{error}</div>}
      {success && <div className="banner success" role="alert">{success}</div>}

      {loading ? (
        <div className="loading">{t('loading')}</div>
      ) : products.length === 0 ? (
        <section className="empty-state">
          <div className="empty-icon" aria-hidden="true">📦</div>
          <h2>{t('noProducts')}</h2>
          <p>{t('createFirstProduct')}</p>
          <Button onClick={()=>onNavigate && onNavigate('upload-product')}>{t('uploadProduct')}</Button>
        </section>
      ) : (
        <section className="products-table">
          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>{t('productName')}</th>
                  <th>{t('category')}</th>
                  <th>{t('price')}</th>
                  <th>{t('stock')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id || product._id}>
                    <td data-label="Product">
                      <strong>{product.name}</strong>
                    </td>
                    <td data-label="Category">{product.category || '—'}</td>
                    <td data-label="Price">৳ {product.price}</td>
                    <td data-label="Stock">{product.stock || 0} units</td>
                    <td data-label="Actions" className="actions-cell">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(product)}
                      >
                        {t('edit')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(product.id || product._id)}
                      >
                        {t('delete')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editingId && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('editProduct')}</h2>
              <button className="close-btn" onClick={() => setEditingId(null)} aria-label="Close">✕</button>
            </div>

            <div className="modal-body">
              <form className="edit-form" onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}>
                <div className="form-group">
                  <label htmlFor="edit-name">{t('productName')}</label>
                  <input
                    id="edit-name"
                    value={editForm.name || ''}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-price">{t('priceBDT')}</label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.price || ''}
                    onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">{t('category')}</label>
                  <input
                    id="edit-category"
                    value={editForm.category || ''}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-stock">{t('stock')}</label>
                  <input
                    id="edit-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.stock || ''}
                    onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-description">{t('description')}</label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description || ''}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="modal-actions">
                  <Button type="submit">{t('saveChanges')}</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>{t('cancel')}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .product-mgmt-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f1fdff 0%, #e6fbff 100%);
          padding: 2rem 1rem 3rem;
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        h1 {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
        }

        .subtitle {
          margin: 0;
          color: #556257;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .banner {
          padding: 0.9rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          font-weight: 600;
        }

        .banner.error {
          background: #fdecea;
          color: #b42318;
          border: 1px solid #f5c2c7;
        }

        .banner.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #556257;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #ffffff;
          border-radius: 12px;
          max-width: 500px;
          margin: 2rem auto;
          box-shadow: 0 6px 16px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          margin: 1rem 0 0.5rem;
          color: #1f2a1e;
        }

        .empty-state p {
          color: #556257;
          margin-bottom: 1.5rem;
        }

        .products-table {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          max-width: 1200px;
          margin: 0 auto;
        }

        .table-container {
          overflow-x: auto;
        }

        .responsive-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .responsive-table thead {
          background: #f0fdff;
          border-bottom: 2px solid #c7f3fb;
        }

        .responsive-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 700;
          color: #1f2a1e;
          border-right: 1px solid #dfe7df;
        }

        .responsive-table th:last-child {
          border-right: none;
        }

        .responsive-table td {
          padding: 1rem;
          border-bottom: 1px solid #dfe7df;
          border-right: 1px solid #dfe7df;
        }

        .responsive-table td:last-child {
          border-right: none;
        }

        .responsive-table tbody tr:hover {
          background: #f0fdff;
        }

        .actions-cell {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #dfe7df;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #556257;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #1f2a1e;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-group label {
          font-weight: 700;
          color: #1f2a1e;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          border: 2px solid #bfeaf2;
          border-radius: 10px;
          padding: 0.85rem 0.9rem;
          font-size: 1rem;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #1eaecb;
          box-shadow: 0 0 0 3px rgba(30, 174, 203, 0.2);
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
          .header-bar {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .responsive-table {
            font-size: 0.85rem;
          }

          .responsive-table th,
          .responsive-table td {
            padding: 0.75rem;
          }

          .actions-cell {
            flex-direction: column;
          }

          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-card {
            max-height: 80vh;
          }
        }
      `}</style>
    </main>
  )
}
