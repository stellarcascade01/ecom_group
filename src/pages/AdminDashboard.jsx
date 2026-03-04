import React, { useState, useEffect } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function AdminDashboard({ user, onNavigate }){
  const [stats, setStats] = useState({ producers: 0, products: 0 })
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats(){
    try{
      const [usersRes, productsRes] = await Promise.all([
        fetch('https://ecom-group.onrender.com/api/users'),
        fetch('https://ecom-group.onrender.com/api/products')
      ])
      
      const users = await usersRes.json()
      const products = await productsRes.json()

      const producers = users.filter(u => u.role === 'producer').length
      setStats({
        producers,
        products: Array.isArray(products) ? products.length : 0
      })
    }catch(err){
      console.error('Failed to fetch stats:', err)
    }finally{
      setLoading(false)
    }
  }

  return (
    <main className="page admin-dashboard" aria-labelledby="admin-title">
      <section className="hero-section">
        <div className="hero-icon" aria-hidden="true">🏛️</div>
        <div>
          <p className="eyebrow">{t('platformControl')}</p>
          <h1 id="admin-title">{t('adminDashboard')}</h1>
          <p className="lead">{t('overseeMarketplace')}</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon" aria-hidden="true">👥</div>
          <div className="stat-content">
            <div className="stat-value" aria-live="polite">{stats.producers}</div>
            <div className="stat-label">{t('activeProducers')}</div>
            <div className="stat-action">
              <Button size="sm" variant="outline" onClick={()=>onNavigate && onNavigate('producers-management')}>
                {t('manageProducersBtn')}
              </Button>
            </div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon" aria-hidden="true">📦</div>
          <div className="stat-content">
            <div className="stat-value" aria-live="polite">{stats.products}</div>
            <div className="stat-label">{t('productsListed')}</div>
            <div className="stat-action">
              <Button size="sm" variant="outline" onClick={()=>onNavigate && onNavigate('home')}>
                {t('viewMarketplace')}
              </Button>
            </div>
          </div>
        </article>
      </section>

      <section className="footer-info">
        <p><strong>Logged in as:</strong> {user?.name || user?.email}</p>
        <p className="muted">Role: {user?.role}</p>
      </section>

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, #f1fdff 0%, #e6fbff 100%);
          padding: 2.5rem 1rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }

        .stat-action {
          margin-top: 0.75rem;
        }

        .hero-section {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #c7f3fb;
          border-radius: 16px;
          padding: 1.5rem 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 1000px;
        }

        .hero-icon {
          font-size: 3rem;
        }

        .eyebrow {
          margin: 0;
          color: #1eaecb;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        h1 {
          margin: 0.1rem 0 0.5rem 0;
          font-size: 2rem;
        }

        .lead {
          margin: 0;
          color: #425a70;
          font-size: 1rem;
          max-width: 500px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          width: 100%;
          max-width: 1000px;
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #dfe7df;
          border-radius: 12px;
          padding: 1.25rem;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: #1eaecb;
          box-shadow: 0 8px 24px rgba(30, 174, 203, 0.1);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #102a43;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #425a70;
          margin-top: 0.2rem;
        }


        .footer-info {
          text-align: center;
          padding: 1.5rem;
          border-top: 1px solid #c7f3fb;
          margin-top: 1rem;
          color: #425a70;
        }

        .footer-info p {
          margin: 0.25rem 0;
        }

        .muted {
          color: #6b7c93;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1.5rem 1rem 2rem;
            gap: 1.5rem;
          }

          .hero-section {
            grid-template-columns: 1fr;
            padding: 1rem 1.25rem;
          }

          .hero-icon {
            font-size: 2.5rem;
            text-align: center;
          }

          h1 {
            font-size: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          /* actions grid removed */
        }
      `}</style>
    </main>
  )
}
