import { useState } from 'react'
import { useCategoryPanel } from '../category/useCategoryPanel'

export default function CategoryPanel({
  categories = [
    'All',
    'Electronics',
    'Fashion & Apparel',
    'Home & Living',
    'Beauty & Personal Care',
    'Sports & Outdoor',
    'Toys & Games',
    'Groceries & Daily Needs',
    'Books & Education',
    'Automotive',
    'Digital & Deals'
  ],
  onSelect,
  priceFilter,
  onPriceChange,
  sortOption,
  onSortChange
}){
  const [activeCategory, setActiveCategory] = useState('All')
  const { isOpen, setIsOpen } = useCategoryPanel()

  const handleSelect = (cat)=>{
    setActiveCategory(cat)
    if(onSelect) onSelect(cat)
  }

  const handlePriceChange = (field, value)=>{
    if(onPriceChange) onPriceChange(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={`category-panel-shell ${isOpen ? 'is-open' : 'is-closed'}`}>
      <aside
        id="category-panel"
        className="category-panel"
        role="navigation"
        aria-label="Categories"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="cart-header">
          <h4>Categories</h4>
        </div>
        <div className="cart-body">
          <ul className="category-list">
            {categories.map(c => (
              <li key={c} style={{marginBottom: '0'}}>
                <button 
                  className={`category-tab ${activeCategory === c ? 'active' : ''}`}
                  onClick={()=>handleSelect(c)}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>

          <div className="filter-block">
            <h5 style={{ margin: '1rem 0 0.5rem' }}>Price range</h5>
            <div className="filter-row">
              <label>Min</label>
              <input
                type="number"
                value={priceFilter?.min ?? ''}
                onChange={(e)=>handlePriceChange('min', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="filter-row">
              <label>Max</label>
              <input
                type="number"
                value={priceFilter?.max ?? ''}
                onChange={(e)=>handlePriceChange('max', e.target.value)}
                placeholder="Any"
              />
            </div>
          </div>

          <div className="filter-block">
            <h5 style={{ margin: '1rem 0 0.5rem' }}>Sort</h5>
            <select value={sortOption} onChange={(e)=> onSortChange && onSortChange(e.target.value)}>
              <option value="none">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="name-asc">Name: A → Z</option>
            </select>
          </div>
        </div>

        <style>{`
        .category-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .category-tab {
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          text-align: left;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .category-tab:hover {
          background-color: var(--hero-start);
          color: var(--link);
        }

        .category-tab.active {
          background-color: transparent;
          color: var(--link);
          border-bottom-color: var(--link);
          font-weight: 700;
        }
      `}</style>
      </aside>

      <button
        className="category-panel-toggle"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-controls="category-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close categories panel' : 'Open categories panel'}
      >
        {isOpen ? '‹' : '›'}
      </button>
    </div>
  )
}
