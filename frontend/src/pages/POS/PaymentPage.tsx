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
      <h1 style={{ marginBottom: '2.5rem', color: '#2C1E16', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Complete Payment</h1>

      <div style={{ display: 'flex', gap: '3rem', width: '100%', maxWidth: '1100px' }}>
        {/* Order Summary */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FDFBF7', border: '2px solid #EAD6C0', padding: '2rem' }}>
          <h2 style={{ borderBottom: '2px solid #EAD6C0', paddingBottom: '1rem', color: '#2C1E16', fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1.5rem 0' }}>Order Summary</h2>
          <div style={{ marginBottom: '1.5rem', color: '#668BA4', fontSize: '1.1rem', fontWeight: 700 }}>
            {customer_name ? <div>Customer: {customer_name} ({customer_phone})</div> : <div>Walk-in Customer</div>}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '2rem' }} className="flex-col gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between" style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #EAD6C0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                <span style={{ fontWeight: 800, color: '#2C1E16', fontSize: '1.1rem' }}>{item.qty}x {item.name}</span>
                <span style={{ fontWeight: 800, color: '#B88655', fontSize: '1.1rem' }}>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid #EAD6C0', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex justify-between items-center" style={{ color: '#668BA4', fontWeight: 700, fontSize: '1.2rem' }}>
              <span>Subtotal</span>
              <span>${total_bill.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between items-center" style={{ color: '#00C853', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>Coupon Discount (10%)</span>
                <span>-${appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center" style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '1.4rem', color: '#2C1E16', fontWeight: 800, textTransform: 'uppercase' }}>Total Amount</span>
              <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#D9480F' }}>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', background: '#FDFBF7', border: '2px solid #EAD6C0', padding: '2rem' }}>
          {/* Coupon Section */}
          <div style={{ background: '#F5EFE6', padding: '1.5rem', borderRadius: '16px', border: '1px solid #EAD6C0' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 800, color: '#2C1E16', textTransform: 'uppercase', letterSpacing: '1px' }}>Have a Coupon Code?</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Enter Code"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid #D4A373', fontWeight: 700 }}
                disabled={appliedDiscount > 0}
              />
              <button 
                style={{ padding: '0 2rem', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '8px', border: 'none', background: (appliedDiscount > 0 || !couponInput) ? '#EAD6C0' : '#D9480F', color: '#fff', cursor: (appliedDiscount > 0 || !couponInput) ? 'not-allowed' : 'pointer' }}
                onClick={handleApplyCoupon}
                disabled={appliedDiscount > 0 || !couponInput}
              >
                Apply
              </button>
            </div>
          </div>

          <h2 style={{ color: '#2C1E16', fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Select Payment Method</h2>
          
          <div className="flex gap-4">
            {(['Cash', 'Card', 'UPI'] as PaymentMethod[]).map(method => {
              const isActive = paymentMethod === method;
              return (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{ 
                    flex: 1, 
                    padding: '1.2rem', 
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    borderRadius: '12px',
                    border: isActive ? 'none' : '2px solid #D4A373',
                    background: isActive ? '#2C1E16' : 'transparent',
                    color: isActive ? '#F9E8D2' : '#B88655',
                    boxShadow: isActive ? '0 6px 16px rgba(44, 30, 22, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {method}
                </button>
              );
            })}
          </div>

          {paymentMethod === 'Cash' && (
            <div style={{ background: '#F5EFE6', padding: '2rem', borderRadius: '16px', border: '1px solid #EAD6C0' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 800, color: '#2C1E16', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem' }}>Amount Tendered</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '2rem', fontWeight: 900, color: '#D9480F' }}>$</span>
                  <input
                    type="number"
                    min={finalTotal}
                    step="0.01"
                    value={amountTendered}
                    onChange={e => setAmountTendered(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '2.5rem', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '12px', border: '2px solid #D4A373', fontWeight: 900, color: '#2C1E16' }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-between items-center" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAD6C0' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#668BA4', textTransform: 'uppercase' }}>Change Due:</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: changeDue > 0 ? '#00C853' : '#B88655' }}>
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#F5EFE6', borderRadius: '16px', border: '1px solid #EAD6C0' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>💳</span>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2C1E16' }}>Process payment on terminal...</p>
            </div>
          )}

          {paymentMethod === 'UPI' && (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#F5EFE6', borderRadius: '16px', border: '1px solid #EAD6C0' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📱</span>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2C1E16' }}>Scan QR code from customer...</p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '1.5rem', paddingTop: '1rem' }}>
            <button
              style={{ flex: 1, padding: '1.2rem', fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '12px', border: '2px solid #D4A373', background: 'transparent', color: '#B88655', cursor: 'pointer' }}
              onClick={handleCancel}
            >
              Back
            </button>
            <button
              style={{ flex: 2, padding: '1.2rem', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', borderRadius: '12px', border: 'none', background: isPaymentValid ? '#00C853' : '#EAD6C0', color: '#fff', cursor: isPaymentValid ? 'pointer' : 'not-allowed', boxShadow: isPaymentValid ? '0 8px 24px rgba(0, 200, 83, 0.3)' : 'none' }}
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
