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
    <div className="glass-card flex-col" style={{ flex: 1.2, height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.7)', border: '2px solid #EAD6C0' }}>
      
      <div style={{ marginBottom: '1.2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input 
          type="text" 
          placeholder="Search for your favorite food..." 
          style={{ 
            width: '100%', 
            boxSizing: 'border-box',
            padding: '1rem 1.5rem 1rem 3.5rem',
            fontSize: '1.1rem',
            borderRadius: '12px',
            border: '2px solid #D4A373',
            background: '#fff',
            color: '#2C1E16',
            fontWeight: 600,
            boxShadow: '0 4px 10px rgba(212, 163, 115, 0.1)'
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-3" style={{ marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              style={{ 
                whiteSpace: 'nowrap', 
                borderRadius: '30px', 
                padding: '0.6rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: isActive ? 'none' : '2px solid #D4A373',
                background: isActive ? '#D9480F' : 'transparent',
                color: isActive ? '#fff' : '#B88655',
                boxShadow: isActive ? '0 4px 12px rgba(217, 72, 15, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
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
              background: '#fff',
              border: '1px solid var(--surface-border)',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
              e.currentTarget.style.borderColor = '#D4A373';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = 'var(--surface-border)';
            }}
          >
            <div style={{
              width: '100%',
              height: '130px',
              backgroundImage: `url(${
                product.category === 'Burgers' ? '/images/burger.png' :
                product.category === 'Beverages' ? '/images/latte.png' :
                product.category === 'Pizza' ? '/images/pizza.png' :
                product.category === 'Pasta' ? '/images/pasta.png' :
                '/images/pastry.png'
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderBottom: '2px solid #EAD6C0'
            }} />
            <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FDFBF7', flex: 1, justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '800', textAlign: 'center', marginBottom: '0.4rem', fontSize: '1rem', color: '#2C1E16', lineHeight: '1.3' }}>{product.name}</span>
              <span style={{ color: '#D9480F', fontWeight: '900', fontSize: '1.25rem' }}>${product.price.toFixed(2)}</span>
            </div>
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
