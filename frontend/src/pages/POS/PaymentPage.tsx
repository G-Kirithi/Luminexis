import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../../store/OrderContext';
import type { OrderItem } from './OrderDetails';

type PaymentMethod = 'Cash' | 'Card' | 'UPI';

interface OrderState {
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_bill: number;
  table_number?: number;
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addOrder, validateAndUseCoupon, generateCoupon, reserveTable } = useOrders();

  const state = location.state as OrderState | null;

  if (!state || !state.items || state.items.length === 0) {
    navigate('/pos/new');
    return null;
  }

  const { customer_name, customer_phone, items, total_bill, table_number } = state;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const finalTotal = total_bill - appliedDiscount;
  const [amountTendered, setAmountTendered] = useState<number | ''>(finalTotal);

  const changeDue = typeof amountTendered === 'number' ? Math.max(0, amountTendered - finalTotal) : 0;
  const isPaymentValid = paymentMethod !== 'Cash' || (typeof amountTendered === 'number' && amountTendered >= finalTotal);

  const handleApplyCoupon = () => {
    if (total_bill < 50) {
      alert('Total bill must be $50 or more to use a coupon.');
      return;
    }
    if (appliedDiscount > 0) {
      alert('A coupon has already been applied.');
      return;
    }
    const isValid = validateAndUseCoupon(couponInput.trim());
    if (isValid) {
      const discount = total_bill * 0.10;
      setAppliedDiscount(discount);
      setAmountTendered(total_bill - discount); // Update tendered default
      alert('Coupon applied successfully! 10% discount.');
    } else {
      alert('Invalid or already used coupon code.');
    }
  };

  const handleComplete = async () => {
    if (!isPaymentValid) {
      alert('Amount tendered must be equal to or greater than the total bill.');
      return;
    }

    let newCode: string | undefined;
    if (finalTotal >= 50) {
      newCode = generateCoupon();
    }

    const orderId = await addOrder({
      customer_name,
      customer_phone,
      items,
      total_bill: finalTotal,
      payment_method: paymentMethod,
      generated_coupon: newCode,
      table_number,
    });

    if (orderId === 0) {
      alert('Failed to save order. Please try again.');
      return;
    }

    if (newCode) {
      alert(`Payment Complete!\n\nGive this coupon code to the customer for their next purchase:\n\n${newCode}`);
    } else {
      alert('Payment Complete!');
    }

    if (table_number) {
      reserveTable(table_number);
    }

    navigate('/pos');
  };

  const handleCancel = () => {
    navigate('/pos/new', { state }); 
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

          <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex justify-between items-center text-muted">
              <span>Subtotal</span>
              <span>${total_bill.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between items-center" style={{ color: 'var(--success-color)' }}>
                <span>Coupon Discount (10%)</span>
                <span>-${appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-color)' }}>Total Amount</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Coupon Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Have a Coupon Code?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter Code"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
                disabled={appliedDiscount > 0}
              />
              <button 
                className="outline" 
                onClick={handleApplyCoupon}
                disabled={appliedDiscount > 0 || !couponInput}
              >
                Apply
              </button>
            </div>
          </div>

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
                  min={finalTotal}
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
