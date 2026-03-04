import React, { useRef, useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function UploadProduct({ currentUser, onNavigate, categories = [] }){
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)
  const categoryOptions = (categories || []).filter(c => c && c !== 'All')

  function handleFileChange(e){
    const file = e.target.files && e.target.files[0]
    setImageFile(file || null)
    if(file){
      try{ setPreview(URL.createObjectURL(file)) }catch{ setPreview('') }
    } else {
      setPreview('')
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    if(!name || !price) return setError(t('productName') + ' ' + t('priceBDT') + ' ' + t('required'))
    setLoading(true)
    try{
      const form = new FormData()
      form.append('name', name)
      form.append('price', String(price))
      form.append('description', description)
      form.append('category', category)
      form.append('stock', String(stock || 0))
      form.append('producer', currentUser?.name || currentUser?.email || 'Producer')
      if(imageFile) form.append('image', imageFile)

      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'X-User-Role': currentUser?.role || 'guest',
          'X-User-Id': currentUser?.id || currentUser?._id || ''
        },
        body: form
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data?.message || 'Failed to create product')
      if(onNavigate) onNavigate('product', { product: { ...data, id: data.id || data._id } })
    }catch(err){
      setError(err.message || 'Failed to create product')
    }finally{ setLoading(false) }
  }

  return (
    <main className="page upload-page" aria-labelledby="upload-title">
      <section className="hero-card">
        <div className="hero-icon" aria-hidden="true">🌾</div>
        <div>
          <h1 id="upload-title">{t('addNewProduct')}</h1>
        </div>
      </section>

      <section className="card" aria-label="Upload form">
        {error && <div className="banner error" role="alert">{error}</div>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="product-name">{t('productName')} *</label>
            <input
              id="product-name"
              value={name}
              onChange={e=>setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="product-price">{t('priceBDT')} *</label>
            <div className="input-shell">
              <span className="prefix" aria-hidden="true">TK</span>
              <input
                id="product-price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={e=>setPrice(e.target.value)}
                required
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="product-category">{t('category')}</label>
            <select
              id="product-category"
              value={category}
              onChange={e=>setCategory(e.target.value)}
            >
              <option value="">{t('selectCategory')}</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="product-stock">{t('stock')}</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={e=>setStock(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="field full">
            <label>{t('coverImage')} <span className="muted">({t('optional').toLowerCase()})</span></label>
            <div className="upload-area">
              <div>
                <p className="upload-title">{t('addCoverPhoto')}</p>
                <div className="upload-actions">
                  <Button type="button" onClick={()=>fileInputRef.current?.click()}>{t('chooseFile')}</Button>
                  <button type="button" className="ghost" onClick={()=>{ setImageFile(null); setPreview(''); if(fileInputRef.current) fileInputRef.current.value=''; }} disabled={!imageFile && !preview}>{t('remove')}</button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-input"
                  aria-label={t('uploadImageFile')}
                />
              </div>
              {preview && (
                <div className="preview" aria-label={t('imagePreview')}>
                  <img src={preview} alt={t('preview')} />
                </div>
              )}
            </div>
          </div>

          <div className="field full">
            <label htmlFor="product-description">{t('description')}</label>
            <textarea
              id="product-description"
              rows={5}
              value={description}
              onChange={e=>setDescription(e.target.value)}
              placeholder={t('productDescriptionPlaceholder')}
            />
          </div>

          <div className="actions">
            <Button type="submit" disabled={loading}>{loading ? t('uploading') : t('publishProduct')}</Button>
            <Button type="button" variant="outline" onClick={()=>onNavigate && onNavigate('producer-dashboard')} disabled={loading}>{t('backToDashboard')}</Button>
          </div>
        </form>
      </section>

      <style>{`
        :global(body) {
          background: linear-gradient(180deg, #f1fdff 0%, #e6fbff 100%);
        }

        .upload-page {
          min-height: 100vh;
          padding: 2.5rem 1rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        }

        .hero-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
          background: #ffffff;
          border: 1px solid #c7f3fb;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .hero-icon {
          font-size: 2.5rem;
        }

        h1 {
          margin: 0.1rem 0 0.25rem;
          font-size: 1.75rem;
        }

        .card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #d7f1f6;
          box-shadow: 0 12px 35px rgba(0,0,0,0.06);
          padding: 1.5rem;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .banner {
          padding: 0.9rem 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .banner.error {
          background: #fdecea;
          color: #b42318;
          border: 1px solid #f5c2c7;
        }

        .form-grid {
          display: grid;
          gap: 1.1rem;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .field.full { grid-column: 1 / -1; }

        label {
          font-weight: 700;
          color: #102a43;
        }

        input, textarea, select {
          width: 100%;
          border: 2px solid #bfeaf2;
          border-radius: 10px;
          padding: 0.85rem 0.9rem;
          font-size: 1rem;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #1eaecb;
          box-shadow: 0 0 0 3px rgba(30, 174, 203, 0.2);
        }

        .input-shell {
          display: flex;
          align-items: center;
          border: 2px solid #bfeaf2;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        .input-shell:focus-within {
          border-color: #1eaecb;
          box-shadow: 0 0 0 3px rgba(30, 174, 203, 0.2);
        }

        .input-shell input {
          border: none;
          box-shadow: none;
          padding: 0.85rem 0.9rem;
        }

        .prefix {
          padding: 0 0.8rem;
          color: #1eaecb;
          font-weight: 800;
        }

        .muted { color: #425a70; font-weight: 500; }

        .upload-area {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          align-items: start;
          border: 2px dashed #bfeaf2;
          border-radius: 12px;
          padding: 1rem;
          background: #f0fdff;
          width: 100%;
          box-sizing: border-box;
        }

        .upload-title {
          margin: 0;
          font-weight: 700;
          color: #102a43;
        }

        .upload-hint {
          margin: 0.2rem 0 0.6rem;
          color: #425a70;
        }

        .upload-actions {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .ghost {
          border: 1px solid #bfeaf2;
          background: #fff;
          color: #102a43;
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          cursor: pointer;
          font-weight: 600;
        }

        .ghost:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hidden-input { display: none; }

        .preview {
          justify-self: end;
          width: 220px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #bfeaf2;
          box-shadow: 0 6px 14px rgba(0,0,0,0.08);
        }

        .preview img { width: 100%; height: 140px; object-fit: cover; display: block; }

        textarea { resize: vertical; min-height: 150px; line-height: 1.6; }

        .actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-start;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .hero-card {
            grid-template-columns: 1fr;
            text-align: left;
          }
          .hero-note { justify-content: flex-start; }
          .upload-area {
            grid-template-columns: 1fr;
          }
          .preview { width: 100%; }
        }
      `}</style>
    </main>
  )
}
