import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FoodCatalog, { type Product } from './FoodCatalog';
import type { OrderItem } from './OrderDetails';
import { useOrders } from '../../store/OrderContext';
import { getProducts } from '../../api';

const NewOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { holdTable, freeTable } = useOrders();

  const state = location.state as { table_number?: number } | null;
  const selectedTable = state?.table_number;

  const isProceeding = useRef(false);

  useEffect(() => {
    if (selectedTable) {
      holdTable(selectedTable);
    }
    return () => {
      // If we unmount and we didn't explicitly proceed to payment, release the hold
      if (selectedTable && !isProceeding.current) {
        freeTable(selectedTable);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products from backend
  useEffect(() => {
    getProducts()
      .then((data: any[]) => {
        setProducts(data.filter(p => p.available_in_pos).map(p => ({
          id: p.id,
          name: p.name,
          category: p.category?.name || 'Other',
          price: p.list_price,
        })));
      })
      .catch(err => console.error('Failed to fetch products', err));
  }, []);

  const totalBill = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleAddProduct = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: Date.now() + Math.random(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        status: 'Pending'
      }];
    });
  };

  const handleUpdateQty = (itemId: number, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add food items to the order.");
      return;
    }
    
    // Phone number validation: exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    isProceeding.current = true;

    navigate('/pos/payment', {
      state: {
        customer_name: customerName,
        customer_phone: customerPhone,
        items,
        total_bill: totalBill,
        table_number: selectedTable
      }
    });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Left Form & Catalog */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ background: '#FDFBF7', border: '2px solid #EAD6C0' }}>
          <button 
            onClick={() => navigate('/pos')} 
            className="outline" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', marginBottom: '1rem', background: 'transparent', border: '2px solid #D4A373', color: '#D4A373', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', display: 'block' }}
          >
            ← Back to POS Dashboard
          </button>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.2rem' }}>
            <h2 style={{ margin: 0, color: '#2C1E16', fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Details</h2>
            {selectedTable && (
              <span style={{ background: '#B88655', color: '#fff', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Table {selectedTable}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#668BA4', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Phone Number *</label>
              <input 
                type="tel" 
                placeholder="e.g. 555-0123" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', border: '2px solid #EAD6C0', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, color: '#2C1E16' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#668BA4', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Customer Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', border: '2px solid #EAD6C0', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 600, color: '#2C1E16' }}
              />
            </div>
          </div>
        </div>

        <FoodCatalog products={products} onAddProduct={handleAddProduct} />
      </div>

      {/* Right Sidebar - Order Summary */}
      <div className="glass-card flex-col" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', background: '#FDFBF7', border: '2px solid #EAD6C0' }}>
        <h2 style={{ marginBottom: '1.2rem', borderBottom: '2px solid #EAD6C0', paddingBottom: '0.8rem', color: '#2C1E16', fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Order Summary</h2>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="flex-col gap-2">
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #EAD6C0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.3rem', paddingRight: '1rem' }}>
                <span style={{ fontWeight: 800, color: '#2C1E16', fontSize: '1.05rem', lineHeight: '1.2' }}>{item.name}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#B88655' }}>${item.price.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F5EFE6', borderRadius: '8px', padding: '0.3rem', border: '1px solid #EAD6C0' }}>
                  <button style={{ padding: '0.2rem 0.6rem', border: 'none', background: '#fff', borderRadius: '6px', fontWeight: 800, color: '#D9480F', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onClick={() => handleUpdateQty(item.id, -1)}>-</button>
                  <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 800, color: '#2C1E16' }}>{item.qty}</span>
                  <button style={{ padding: '0.2rem 0.6rem', border: 'none', background: '#fff', borderRadius: '6px', fontWeight: 800, color: '#00C853', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                </div>
                <span style={{ fontWeight: 900, minWidth: '4.5rem', textAlign: 'right', color: '#D9480F', fontSize: '1.1rem' }}>${(item.price * item.qty).toFixed(2)}</span>
                <button style={{ padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', background: '#FFE3E3', color: '#FA5252', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleRemoveItem(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '3rem', color: '#668BA4', fontWeight: 600, fontSize: '1.1rem' }}>No items added yet. Start tapping!</div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #EAD6C0' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.2rem', color: '#668BA4', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Bill</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D9480F' }}>${totalBill.toFixed(2)}</span>
          </div>
          <button 
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', background: '#2C1E16', color: '#F9E8D2', fontWeight: 800, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(44, 30, 22, 0.2)', textTransform: 'uppercase', letterSpacing: '1px' }}
            onClick={handleSubmit}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;
