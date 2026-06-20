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
        setProducts(data.map(p => ({
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
        <div className="glass-card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Customer Details</h2>
            {selectedTable && (
              <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
                Table {selectedTable}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number *</label>
              <input 
                type="tel" 
                placeholder="e.g. 555-0123" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Customer Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <FoodCatalog products={products} onAddProduct={handleAddProduct} />
      </div>

      {/* Right Sidebar - Order Summary */}
      <div className="glass-card flex-col" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Order Summary</h2>
        
        <div style={{ flex: 1, overflowY: 'auto' }} className="flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center" style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div className="flex-col" style={{ flex: 1 }}>
                <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>${item.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '0.2rem' }}>
                  <button className="outline" style={{ padding: '0.2rem 0.5rem', border: 'none', borderRadius: '50%' }} onClick={() => handleUpdateQty(item.id, -1)}>-</button>
                  <span style={{ minWidth: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                  <button className="outline" style={{ padding: '0.2rem 0.5rem', border: 'none', borderRadius: '50%' }} onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                </div>
                <span style={{ fontWeight: 'bold', minWidth: '3.5rem', textAlign: 'right' }}>${(item.price * item.qty).toFixed(2)}</span>
                <button className="danger outline" style={{ padding: '0.2rem 0.5rem', border: 'none' }} onClick={() => handleRemoveItem(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No items added yet.</div>
          )}
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total Bill</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${totalBill.toFixed(2)}</span>
          </div>
          <button 
            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: 'var(--primary-color)' }}
            onClick={handleSubmit}
          >
            Proceed to Payment (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;
