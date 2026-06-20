import React, { useState } from 'react';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image?: string;
}

interface FoodCatalogProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}



const FoodCatalog: React.FC<FoodCatalogProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Derive categories dynamically from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="glass-card flex-col" style={{ flex: 1.2, height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="🔍 Search for food..." 
          style={{ width: '100%', boxSizing: 'border-box' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2" style={{ marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? '' : 'outline'}
            style={{ whiteSpace: 'nowrap', borderRadius: '20px', padding: '0.4rem 1rem' }}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '1rem',
        alignContent: 'start',
        paddingRight: '0.5rem'
      }}>
        {filteredProducts.map(product => (
          <div 
            key={product.id}
            onClick={() => onAddProduct(product)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--surface-border)',
              borderRadius: '12px',
              padding: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(51, 154, 240, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--surface-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1rem'
            }}>
              {product.category === 'Burger' ? '🍔' : 
               product.category === 'Drinks' ? '🥤' : 
               product.category === 'Wraps' ? '🌯' : 
               product.category === 'Combo Meal' ? '🍱' : '🍽️'}
            </div>
            <span style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{product.name}</span>
            <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>${product.price.toFixed(2)}</span>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '2rem' }} className="text-muted">
            No products found
          </div>
        )}
      </div>

    </div>
  );
};

export default FoodCatalog;
