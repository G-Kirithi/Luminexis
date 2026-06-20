import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../../store/OrderContext';
import type { OrderItem } from './OrderDetails';

type PaymentMethod = 'Cash' | 'Card' | 'UPI';

interface OrderState {
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_bill: number;
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addOrder } = useOrders();

  const state = location.state as OrderState | null;

  if (!state || !state.items || state.items.length === 0) {
    navigate('/pos/new');
    return null;
  }

  const { customer_name, customer_phone, items, total_bill } = state;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<number | ''>(total_bill);

  const changeDue = typeof amountTendered === 'number' ? Math.max(0, amountTendered - total_bill) : 0;
  const isPaymentValid = paymentMethod !== 'Cash' || (typeof amountTendered === 'number' && amountTendered >= total_bill);

  const handleComplete = () => {
    if (!isPaymentValid) {
      alert('Amount tendered must be equal to or greater than the total bill.');
      return;
    }

    addOrder({
      customer_name,
      customer_phone,
      items,
      total_bill,
      payment_method: paymentMethod,
    });

    navigate('/pos');
  };

  const handleCancel = () => {
    navigate('/pos/new', { state }); // Go back preserving state if needed (NewOrderPage would need to read this state to populate, but for simplicity, we'll just go back and it will be empty)
    // For now, let's just go back to /pos/new empty or let them use browser back.
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', alignItems: 'center', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Payment</h1>

      <div style={{ display: 'flex', gap: '2rem', width: '100%', maxWidth: '900px' }}>
        {/* Order Summary */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Order Summary</h2>
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {customer_name ? <div>Customer: {customer_name} ({customer_phone})</div> : <div>Walk-in Customer</div>}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }} className="flex-col gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span>{item.qty}x {item.name}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total Amount</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${total_bill.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2>Select Payment Method</h2>
          
          <div className="flex gap-4">
            {(['Cash', 'Card', 'UPI'] as PaymentMethod[]).map(method => (
              <button
                key={method}
                className={paymentMethod === method ? '' : 'outline'}
                onClick={() => setPaymentMethod(method)}
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Cash' && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount Tendered</label>
                <input
                  type="number"
                  min={total_bill}
                  step="0.01"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: '1.5rem', padding: '0.5rem' }}
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: '1.2rem' }}>Change Due:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: changeDue > 0 ? 'var(--warning-color)' : 'var(--text-muted)' }}>
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <span style={{ fontSize: '3rem' }}>💳</span>
              <p className="text-muted">Process payment on terminal...</p>
            </div>
          )}

          {paymentMethod === 'UPI' && (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <span style={{ fontSize: '3rem' }}>📱</span>
              <p className="text-muted">Scan QR code from customer...</p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
            <button
              className="outline"
              style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              onClick={handleCancel}
            >
              Back
            </button>
            <button
              style={{ flex: 2, padding: '1rem', fontSize: '1.2rem', background: isPaymentValid ? 'var(--success-color)' : 'var(--text-muted)', cursor: isPaymentValid ? 'pointer' : 'not-allowed' }}
              onClick={handleComplete}
              disabled={!isPaymentValid}
            >
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
