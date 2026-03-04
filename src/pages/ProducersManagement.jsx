import React, { useState, useEffect, useCallback } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function ProducersManagement({ currentUser, onNavigate }){
  const [producers, setProducers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProducer, setSelectedProducer] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const fetchProducers = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const res = await fetch('https://ecom-group.onrender.com/api/users')
      if(!res.ok) throw new Error(t('failedToFetchUsers'))
      const allUsers = await res.json()
      const producersList = allUsers.filter(u => u.role === 'producer')
      setProducers(producersList)
    }catch(err){
      setError(err.message || t('failedToLoadProducers'))
    }finally{
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchProducers()
  }, [fetchProducers])

  function handleViewProfile(producer){
    setSelectedProducer(producer)
  }

  function handleCloseProfile(){
    setSelectedProducer(null)
  }

  function getProducerName(p){
    return (p?.name || p?.email || '').trim()
  }

  async function setBlockedForProducer(producer, blocked){
    if(!producer?._id) return
    setError('')
    setSavingId(producer._id)
    try{
      const res = await fetch(`https://ecom-group.onrender.com/api/users/${producer._id}/blocked`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUser?.role || 'guest'
        },
        body: JSON.stringify({ blocked })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data?.message || t('failedToUpdateStatus'))

      if(selectedProducer?._id === data._id) setSelectedProducer(data)
      setProducers(list => list.map(p => (p._id === data._id ? { ...p, ...data } : p)))
    }catch(err){
      setError(err.message || t('failedToUpdateStatus'))
    }finally{
      setSavingId(null)
    }
  }

  async function toggleBlocked(producer){
    if(!producer?._id) return

    const nextBlocked = !producer.blocked
    const confirmKey = nextBlocked ? 'confirmBlockUser' : 'confirmUnblockUser'
    if(!window.confirm(t(confirmKey))) return

    await setBlockedForProducer(producer, nextBlocked)
  }

  return (
    <main className="page producers-mgmt-page" aria-labelledby="producers-title">
      <section className="header-bar">
        <div>
          <h1 id="producers-title">{t('producerManagement')}</h1>
          <p className="subtitle">{t('producerManagementSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={()=>onNavigate && onNavigate('admin-dashboard')}>{t('back')}</Button>
      </section>

      {error && <div className="banner error" role="alert">{error}</div>}

      {loading ? (
        <div className="loading">{t('loadingProducers')}</div>
      ) : producers.length === 0 ? (
        <div className="empty">
          <p>{t('noProducersYet')}</p>
        </div>
      ) : (
        <section className="producers-grid">
          {producers.map(producer => (
            <article key={producer._id} className="producer-card">
              <div className="card-header">
                <h2 className="producer-name">{producer.name}</h2>
                <span className="badge">{t(producer.role)}</span>
              </div>

              <div className="card-body">
                {producer.email && (
                  <div className="field-row">
                    <span className="label">{t('email')}</span>
                    <a href={`mailto:${producer.email}`} className="value">{producer.email}</a>
                  </div>
                )}
                {producer.phone && (
                  <div className="field-row">
                    <span className="label">{t('phoneLabel')}</span>
                    <a href={`tel:${producer.phone}`} className="value">{producer.phone}</a>
                  </div>
                )}
                {producer.createdAt && (
                  <div className="field-row">
                    <span className="label">{t('joined')}</span>
                    <span className="value">{new Date(producer.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <Button onClick={()=>handleViewProfile(producer)} size="sm">{t('viewProfile')}</Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => toggleBlocked(producer)}
                  disabled={savingId === producer._id}
                >
                  {t(producer.blocked ? 'unblockUser' : 'blockUser')}
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedProducer && (
        <div className="modal-overlay" onClick={handleCloseProfile}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProducer.name}</h2>
              <button className="close-btn" onClick={handleCloseProfile} aria-label={t('close')}>✕</button>
            </div>

            <div className="modal-body">
              <section className="modal-section">
                <h3>{t('contactDetails')}</h3>
                {selectedProducer.email && <p><strong>{t('email')}:</strong> <a href={`mailto:${selectedProducer.email}`}>{selectedProducer.email}</a></p>}
                {selectedProducer.phone && <p><strong>{t('phone')}:</strong> <a href={`tel:${selectedProducer.phone}`}>{selectedProducer.phone}</a></p>}
              </section>

              <section className="modal-section">
                <h3>{t('accountInfo')}</h3>
                <p><strong>{t('role')}:</strong> {t(selectedProducer.role)}</p>
                <p><strong>{t('status')}:</strong> {t(selectedProducer.blocked ? 'blocked' : 'active')}</p>
                <p><strong>{t('joined')}:</strong> {new Date(selectedProducer.createdAt).toLocaleDateString()}</p>
              </section>

              <section className="modal-section">
                <h3>{t('actions')}</h3>
                <div className="action-buttons">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const producerName = getProducerName(selectedProducer)
                      if (!producerName) return
                      handleCloseProfile()
                      onNavigate && onNavigate('producer-shop', { producerName })
                    }}
                  >
                    {t('viewShop')}
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => toggleBlocked(selectedProducer)}
                    disabled={savingId === selectedProducer._id}
                  >
                    {t(selectedProducer.blocked ? 'unblockUser' : 'blockUser')}
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .producers-mgmt-page {
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

        .loading, .empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #556257;
          font-weight: 600;
        }

        .producers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .producer-card {
          background: #ffffff;
          border: 1px solid #dfe7df;
          border-radius: 12px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.05);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .producer-name {
          margin: 0;
          font-size: 1.1rem;
        }

        .badge {
          padding: 0.25rem 0.6rem;
          background: #e9fbff;
          color: #1eaecb;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .field-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 0.5rem;
        }

        .label {
          font-weight: 700;
          color: #1f2a1e;
        }

        .value {
          color: #1eaecb;
          text-decoration: none;
        }

        .value:hover {
          text-decoration: underline;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.25rem;
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
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .modal-section h3 {
          margin: 0 0 0.75rem 0;
          color: #1f2a1e;
        }

        .modal-section p {
          margin: 0.4rem 0;
          color: #445344;
        }

        .modal-section a {
          color: #1eaecb;
          text-decoration: none;
        }

        .modal-section a:hover {
          text-decoration: underline;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .header-bar {
            flex-direction: column;
          }

          .producers-grid {
            grid-template-columns: 1fr;
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
