import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories, createProduct, deleteProduct } from '../../api';

interface Product {
  id: number;
  name: string;
  list_price: number;
  description: string | null;
  available_in_pos: boolean;
  show_in_kds: boolean;
  category: {
    id: number;
    name: string;
    color: string | null;
  };
}

interface Category {
  id: number;
  name: string;
  color: string | null;
}

const MenuManagement = () => {
  const navigate = useNavigate();

  // State lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [availableInPos, setAvailableInPos] = useState(true);
  const [showInKds, setShowInKds] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success messaging
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const franchiseName = sessionStorage.getItem('franchise_name');
    if (!franchiseName) {
      setError('Please select a franchise first.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const prodData = await getProducts();
      const catData = await getCategories();
      setProducts(prodData);
      setCategories(catData);
      if (catData.length > 0) {
        setCategoryId(catData[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
      setError('Could not retrieve menu categories or products from the server. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price (>= 0).');
      return;
    }

    if (!categoryId) {
      setFormError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        list_price: priceNum,
        categ_id: parseInt(categoryId),
        description: description.trim() || null,
        available_in_pos: availableInPos,
        show_in_kds: showInKds,
        uom_id: 'units',
        taxes_id: 0.0,
      };

      await createProduct(payload);
      setSuccessMessage(`"${name}" was successfully added to the menu!`);
      
      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setAvailableInPos(true);
      setShowInKds(true);
      
      // Refresh list
      const prodData = await getProducts();
      setProducts(prodData);
    } catch (err: any) {
      console.error('Failed to add product:', err);
      setFormError(err.response?.data?.detail || 'Failed to create new product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the menu?`)) {
      return;
    }

    setSuccessMessage('');
    setError('');
    try {
      const res = await deleteProduct(productId);
      setSuccessMessage(res.message || `"${productName}" was successfully removed.`);
      
      // Refresh list
      const prodData = await getProducts();
      setProducts(prodData);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      setError(err.response?.data?.detail || 'Failed to delete the product.');
    }
  };

  const activeProducts = products.filter(p => p.available_in_pos);

  // Pagination configuration
  const itemsPerPage = 6;
  const totalPages = Math.ceil(activeProducts.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedProducts = activeProducts.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const franchiseName = sessionStorage.getItem('franchise_name');

  // 1. Missing Franchise state
  if (!franchiseName) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#FDFBF7', color: '#2C1E16', gap: '1.5rem' }}>
        <div style={{ fontSize: '4.5rem', margin: 0 }}>🏢</div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, color: '#2C1E16' }}>No Franchise Selected</h2>
        <p style={{ color: '#B88655', fontWeight: 700, fontSize: '1.1rem', margin: 0, textAlign: 'center' }}>You must select a franchise location to access its menu management panel.</p>
        <button 
          onClick={() => navigate('/franchise-selector')}
          style={{ padding: '0.9rem 2rem', fontSize: '1.1rem', background: '#2C1E16', color: '#F9E8D2', fontWeight: 800, border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(44,30,22,0.15)' }}
        >
          Select Franchise Location
        </button>
      </div>
    );
  }

  // 2. Fetch error state
  if (error && products.length === 0) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#FDFBF7', color: '#2C1E16', gap: '1.5rem' }}>
        <div style={{ fontSize: '4.5rem', margin: 0 }}>❌</div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#2C1E16' }}>Could Not Connect to Database</h2>
        <p style={{ color: '#E03131', fontWeight: 700, fontSize: '1.1rem', margin: 0, textAlign: 'center', maxWidth: '500px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={fetchData}
            style={{ padding: '0.9rem 1.8rem', fontSize: '1rem', background: '#2C1E16', color: '#F9E8D2', fontWeight: 800, border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(44,30,22,0.15)' }}
          >
            🔄 Retry Connection
          </button>
          <button 
            onClick={() => navigate('/pos')}
            className="outline"
            style={{ padding: '0.9rem 1.8rem', fontSize: '1rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
          >
            ← Back to POS Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#FDFBF7', color: '#2C1E16' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => navigate('/pos')} 
            className="outline" 
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', marginBottom: '0.5rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            ← Back to POS Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#2C1E16' }}>🍔 Menu Management</h1>
          <span style={{ color: '#B88655', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>Add and remove items in the restaurant menu catalog</span>
        </div>
      </div>

      {successMessage && (
        <div style={{ padding: '1rem', borderRadius: '10px', background: '#E8F5E9', border: '2px solid #81C784', color: '#2E7D32', fontWeight: 700 }}>
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', borderRadius: '10px', background: '#FFF5F5', border: '2px solid #ff6b6b', color: '#E03131', fontWeight: 700 }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#B88655', fontWeight: 700, fontSize: '1.2rem' }}>
          Loading menu items catalog...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Add Item Form */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff', border: '2.5px solid #EAD6C0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(44,30,22,0.05)' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 900, color: '#2C1E16', borderBottom: '2.5px solid #EAD6C0', paddingBottom: '0.5rem' }}>➕ Add New Menu Item</h2>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Item Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chocolate Fudge Muffin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1.5px solid #EAD6C0', fontSize: '1rem', color: '#2C1E16', fontWeight: 600 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1.5px solid #EAD6C0', fontSize: '1rem', color: '#2C1E16', fontWeight: 600 }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Category *</label>
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1.5px solid #EAD6C0', fontSize: '1rem', color: '#2C1E16', fontWeight: 600, background: '#fff', cursor: 'pointer' }}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B88655', textTransform: 'uppercase' }}>Description</label>
                <textarea 
                  placeholder="Describe the ingredients, taste, or portion size..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1.5px solid #EAD6C0', fontSize: '0.95rem', color: '#2C1E16', fontWeight: 600, minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', background: '#FDFBF7', border: '1.5px solid #EAD6C0', borderRadius: '8px', padding: '0.8rem 1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={availableInPos} 
                    onChange={(e) => setAvailableInPos(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Available in POS
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={showInKds} 
                    onChange={(e) => setShowInKds(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Show in Kitchen (KDS)
                </label>
              </div>

              {formError && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#FFF5F5', border: '1.5px solid #ff6b6b', color: '#E03131', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                  {formError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', background: '#2C1E16', color: '#F9E8D2', fontWeight: 800, border: 'none', borderRadius: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(44,30,22,0.15)', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Adding Item...' : 'Add Item to Menu'}
              </button>
            </form>
          </div>

          {/* Menu Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 900, color: '#2C1E16' }}>📋 Active Menu Items ({activeProducts.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {paginatedProducts.map(p => (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    border: '2px solid #EAD6C0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 12px rgba(44,30,22,0.03)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2C1E16' }}>{p.name}</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        color: p.category?.color || '#B88655', 
                        background: p.category?.color ? `${p.category.color}15` : '#F5EFE6', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '6px', 
                        textTransform: 'uppercase',
                        border: p.category?.color ? `1px solid ${p.category.color}33` : '1px solid #EAD6C0'
                      }}>
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </div>
                    {p.description && (
                      <span style={{ fontSize: '0.9rem', color: '#668BA4', fontWeight: 600 }}>{p.description}</span>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#B88655', fontWeight: 700 }}>
                      <span>POS: Available</span>
                      <span>•</span>
                      <span>KDS: {p.show_in_kds ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D9480F' }}>${p.list_price.toFixed(2)}</span>
                    <button 
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '8px', border: '2px solid #ff6b6b', background: '#FFF5F5', color: '#E03131', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}

              {activeProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #EAD6C0', borderRadius: '16px', color: '#B88655', fontWeight: 700 }}>
                  No active products found in the menu. Add some using the form!
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', background: '#ffffff', border: '2px solid #EAD6C0', borderRadius: '12px', padding: '0.6rem 1.5rem', boxShadow: '0 4px 10px rgba(44,30,22,0.03)' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: safeCurrentPage === 1 ? '#EAD6C0' : '#2C1E16',
                    color: safeCurrentPage === 1 ? '#8B7355' : '#F9E8D2',
                    cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    fontWeight: 700,
                    boxShadow: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Prev
                </button>
                
                <span style={{ fontWeight: 800, color: '#2C1E16', fontSize: '1rem' }}>
                  Page {safeCurrentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    background: safeCurrentPage === totalPages ? '#EAD6C0' : '#2C1E16',
                    color: safeCurrentPage === totalPages ? '#8B7355' : '#F9E8D2',
                    cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    fontWeight: 700,
                    boxShadow: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
