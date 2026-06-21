import React, { useState, useEffect } from 'react';
import { useOrders } from '../../store/OrderContext';
import FoodCatalog, { type Product } from '../POS/FoodCatalog';
import { getProducts, getFranchises, submitComplaint, getComplaints, uploadComplaintPhoto } from '../../api';
import type { OrderItem } from '../POS/OrderDetails';

type Step = 'auth' | 'order' | 'payment' | 'reserve' | 'success';

const CustomerPage = () => {
  const { orders, tables, reserveTable, addOrder, updateOrderTable, validateAndUseCoupon, generateCoupon } = useOrders();
  
  const [activeFranchise, setActiveFranchise] = useState<string | null>(sessionStorage.getItem('franchise_name'));
  const [availableFranchises, setAvailableFranchises] = useState<any[]>([]);
  
  const [step, setStep] = useState<Step>('auth');
  
  // Auth state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [reservedTable, setReservedTable] = useState<number | null>(null);

  // Order state
  const [items, setItems] = useState<OrderItem[]>([]);
  const totalBill = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'UPI'>('Card');
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [orderType, setOrderType] = useState<'Dine In' | 'Walk Away'>('Dine In');
  const finalTotal = totalBill - appliedDiscount;
  const [products, setProducts] = useState<Product[]>([]);

  // Support and refund state
  const [activeTab, setActiveTab] = useState<'order' | 'support'>('order');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [isRefundRequest, setIsRefundRequest] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [orderReference, setOrderReference] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Fetch available franchises if not selected
  useEffect(() => {
    if (!activeFranchise) {
      getFranchises()
        .then(data => setAvailableFranchises(data))
        .catch(err => console.error('Failed to load franchises:', err));
    }
  }, [activeFranchise]);

  // Fetch products from backend
  useEffect(() => {
    if (!activeFranchise) return;
    
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
  }, [activeFranchise]);

  const selectCustomerFranchise = (name: string) => {
    sessionStorage.setItem('franchise_name', name);
    setActiveFranchise(name);
  };

  const fetchComplaints = () => {
    if (!customerPhone) return;
    setLoadingComplaints(true);
    getComplaints(customerPhone)
      .then((data: any) => {
        setComplaints(data);
      })
      .catch(err => console.error('Failed to fetch complaints', err))
      .finally(() => setLoadingComplaints(false));
  };

  useEffect(() => {
    if (activeTab === 'support' && customerPhone) {
      fetchComplaints();
    }
  }, [activeTab, customerPhone]);

  const [generatedCouponCode, setGeneratedCouponCode] = useState<string | null>(null);

  const handleLogout = () => {
    setStep('auth');
    setCustomerName('');
    setCustomerPhone('');
    setPassword('');
    setReservedTable(null);
    setItems([]);
    setCurrentOrderId(null);
    setAppliedDiscount(0);
    setCouponInput('');
    setOrderType('Dine In');
    setGeneratedCouponCode(null);
    setActiveTab('order');
    setComplaintMessage('');
    setIsRefundRequest(false);
    setRefundAmount(0);
    setOrderReference('');
    setPhotoUrl('');
    setIsUploadingPhoto(false);
    setComplaints([]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadComplaintPhoto(file);
      setPhotoUrl(res.photo_url);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintMessage.trim()) {
      alert('Please enter a message for your complaint.');
      return;
    }
    if (isRefundRequest) {
      if (!orderReference) {
        alert('Please select an order reference for your refund request.');
        return;
      }
      if (refundAmount <= 0) {
        alert('Please enter a valid refund amount greater than 0.');
        return;
      }
    }

    try {
      await submitComplaint({
        customer_phone: customerPhone,
        customer_name: customerName,
        message: complaintMessage,
        is_refund_request: isRefundRequest,
        order_id: isRefundRequest ? orderReference : null,
        refund_status: 'Pending',
        refund_amount: isRefundRequest ? Number(refundAmount) : 0,
        photo_url: photoUrl || null
      });

      alert('Complaint submitted successfully!');
      setComplaintMessage('');
      setIsRefundRequest(false);
      setRefundAmount(0);
      setOrderReference('');
      setPhotoUrl('');
      fetchComplaints();
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const renderSubNav = () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      borderBottom: '1px solid var(--surface-border)',
      paddingBottom: '1rem'
    }}>
      <button 
        className={activeTab === 'order' ? 'primary' : 'outline'} 
        type="button"
        onClick={() => setActiveTab('order')}
        style={{ padding: '0.5rem 1.2rem', fontSize: '0.95rem' }}
      >
        🍔 Order Food
      </button>
      <button 
        className={activeTab === 'support' ? 'primary' : 'outline'} 
        type="button"
        onClick={() => setActiveTab('support')}
        style={{ padding: '0.5rem 1.2rem', fontSize: '0.95rem' }}
      >
        💬 Support & Refunds
      </button>
    </div>
  );

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone || customerPhone.length !== 10 || !password) {
      alert("Please enter a valid 10-digit phone number and a password.");
      return;
    }

    const accountsStr = localStorage.getItem('mock_customer_accounts') || '{}';
    const accounts = JSON.parse(accountsStr);

    if (isSignUp) {
      if (!customerName) {
        alert("Please enter your name to sign up.");
        return;
      }
      if (accounts[customerPhone]) {
        alert("An account with this phone number already exists! Please Sign In.");
        setIsSignUp(false);
        return;
      }
      accounts[customerPhone] = { name: customerName, password, reservedTable: null };
      localStorage.setItem('mock_customer_accounts', JSON.stringify(accounts));
      alert("Account created successfully!");
      setStep('order');
    } else {
      const acc = accounts[customerPhone];
      if (!acc) {
        alert("Account not found. Please Sign Up first.");
        setIsSignUp(true);
        return;
      }
      if (acc.password !== password) {
        alert("Incorrect password!");
        return;
      }
      setCustomerName(acc.name);
      setReservedTable(acc.reservedTable || null);
      
      // If they already have a reservation, let them just view it or order more food?
      // For now, take them to the order step
      setStep('order');
    }
  };

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

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      alert("Please add food items to your cart first.");
      return;
    }
    setStep('payment');
  };

  const handleApplyCoupon = () => {
    if (totalBill < 50) {
      alert('Total bill must be $50 or more to use a coupon.');
      return;
    }
    if (appliedDiscount > 0) {
      alert('A coupon has already been applied.');
      return;
    }
    const isValid = validateAndUseCoupon(couponInput.trim());
    if (isValid) {
      const discount = totalBill * 0.10;
      setAppliedDiscount(discount);
      alert('Coupon applied successfully! 10% discount.');
    } else {
      alert('Invalid or already used coupon code.');
    }
  };

  const handleCompletePayment = async () => {
    let newCode: string | undefined;
    if (finalTotal >= 50) {
      newCode = generateCoupon();
      setGeneratedCouponCode(newCode);
    } else {
      setGeneratedCouponCode(null);
    }

    // 1. Create the order
    const orderId = await addOrder({
      customer_name: customerName,
      customer_phone: customerPhone,
      items,
      total_bill: finalTotal,
      payment_method: paymentMethod,
      generated_coupon: newCode,
    });

    if (orderId === 0) {
      alert('Failed to save order. Please try again.');
      return;
    }

    if (newCode) {
      alert(`Payment Complete!\n\nYou earned a 10% discount coupon for your next purchase: ${newCode}`);
    } else {
      alert('Payment Complete! Your order has been sent to the kitchen.');
    }
    
    setCurrentOrderId(orderId);
    
    // 2. Clear cart and move to next step
    setItems([]);
    setAppliedDiscount(0);
    setCouponInput('');
    
    if (orderType === 'Dine In') {
      setStep('reserve');
    } else {
      setStep('success');
    }
  };

  const handleTableClick = (tableNumber: number, status: string) => {
    if (reservedTable) {
      alert(`You already have a reservation for Table ${reservedTable}!`);
      return;
    }
    if (status !== 'Available') {
      alert('This table is not available.');
      return;
    }
    if (window.confirm(`Would you like to reserve Table ${tableNumber}?`)) {
      reserveTable(tableNumber);
      setReservedTable(tableNumber);
      
      if (currentOrderId !== null) {
        updateOrderTable(currentOrderId, tableNumber);
      }
      
      const accountsStr = localStorage.getItem('mock_customer_accounts') || '{}';
      const accounts = JSON.parse(accountsStr);
      if (accounts[customerPhone]) {
        accounts[customerPhone].reservedTable = tableNumber;
        localStorage.setItem('mock_customer_accounts', JSON.stringify(accounts));
      }

      alert(`Table ${tableNumber} has been successfully reserved under ${customerName}!`);
    }
  };

  const handleChangeLocation = () => {
    sessionStorage.removeItem('franchise_name');
    setActiveFranchise(null);
    handleLogout();
  };

  const renderHeader = (title: string, subtitle: string) => (
    <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <span style={{ color: 'var(--text-muted)' }}>
          Location: <strong style={{ color: 'var(--primary-color)', textTransform: 'capitalize' }}>{activeFranchise}</strong> | {subtitle}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleChangeLocation} className="outline" style={{ padding: '0.5rem 1rem' }}>
          🏢 Change Location
        </button>
        <button onClick={handleLogout} className="outline danger" style={{ padding: '0.5rem 1rem' }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  if (!activeFranchise) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 600, fontFamily: 'var(--heading-font)', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
            Odoo Cafe POS
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Please select a franchise location to order or request support</p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px', width: '100%' }}>
          {availableFranchises.map(f => (
            <div
              key={f.id}
              className="glass-card"
              onClick={() => selectCustomerFranchise(f.name)}
              style={{
                padding: '2rem',
                flex: '1 1 180px',
                textAlign: 'center',
                cursor: 'pointer',
                border: '1px solid var(--surface-border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{f.name}</h3>
            </div>
          ))}
          {availableFranchises.length === 0 && (
            <p className="text-muted">Loading available locations...</p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
        <div className="glass-card flex-col gap-2" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem' }}>Customer Portal</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              className={!isSignUp ? 'primary' : 'outline'} 
              onClick={() => setIsSignUp(false)}
              style={{ padding: '0.4rem 1rem' }}
            >
              Sign In
            </button>
            <button 
              className={isSignUp ? 'primary' : 'outline'} 
              onClick={() => setIsSignUp(true)}
              style={{ padding: '0.4rem 1rem' }}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone Number (10 digits) *</label>
              <input 
                type="tel" 
                placeholder="1234567890" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password *</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ marginTop: '1rem', background: 'var(--primary-color)' }}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeTab === 'support') {
    const customerOrders = orders.filter(o => o.customer_phone === customerPhone);
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', maxWidth: '1200px', margin: '0 auto' }}>
        {renderHeader(`Welcome, ${customerName}!`, '💬 Customer Support & Refund Requests')}
        {renderSubNav()}

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* File Complaint Form */}
          <div className="glass-card flex-col" style={{ flex: 1, minWidth: '320px', padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Submit a Complaint / Claim</h2>
            <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div className="flex-col gap-2">
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Describe your issue *</label>
                <textarea
                  placeholder="Tell us what went wrong..."
                  value={complaintMessage}
                  onChange={e => setComplaintMessage(e.target.value)}
                  rows={4}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-family)',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="flex items-center gap-2" style={{ margin: '0.5rem 0' }}>
                <input
                  type="checkbox"
                  id="refundCheck"
                  checked={isRefundRequest}
                  onChange={e => setIsRefundRequest(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="refundCheck" style={{ cursor: 'pointer', fontWeight: 600 }}>This is a refund request</label>
              </div>

              {isRefundRequest && (
                <div className="flex-col gap-4" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                  <div className="flex-col gap-2">
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Select Order Reference *</label>
                    <select
                      value={orderReference}
                      onChange={e => setOrderReference(e.target.value)}
                      style={{
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--surface-border)',
                        background: '#fff',
                        color: 'var(--text-color)',
                        outline: 'none'
                      }}
                    >
                      <option value="">-- Choose past order --</option>
                      {customerOrders.map(o => (
                        <option key={o.id} value={o.order_id}>
                          {o.order_id} - ${o.total_bill.toFixed(2)} ({new Date(o.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-col gap-2">
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Requested Refund Amount ($) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={refundAmount || ''}
                      onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex-col gap-2">
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Attach Proof Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  id="photoUploadInput"
                  disabled={isUploadingPhoto}
                />
                <label
                  htmlFor="photoUploadInput"
                  className="outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px dashed var(--primary-color)',
                    cursor: 'pointer',
                    color: 'var(--primary-color)',
                    textAlign: 'center',
                    fontWeight: 600
                  }}
                >
                  {isUploadingPhoto ? 'Uploading...' : '📁 Choose Image'}
                </label>
                
                {photoUrl && (
                  <div style={{ marginTop: '0.5rem', position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={`http://localhost:8000${photoUrl}`} 
                      alt="Upload Preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--surface-border)' }} 
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="danger outline"
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" style={{ marginTop: '1rem', background: 'var(--primary-color)' }}>
                Submit Complaint
              </button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="glass-card flex-col" style={{ flex: 1.2, minWidth: '320px', padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Your History & Status</h2>
            
            {loadingComplaints ? (
              <p className="text-muted">Loading your tickets...</p>
            ) : complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span style={{ fontSize: '3rem' }}>📁</span>
                <p className="text-muted" style={{ marginTop: '1rem' }}>You have not submitted any complaints yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {complaints.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '12px',
                      padding: '1.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                      position: 'relative'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {new Date(t.created_at).toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          border: '1px solid currentColor',
                          color: t.refund_status === 'Approved' ? 'var(--success-color)' : t.refund_status === 'Rejected' ? 'var(--accent-color)' : 'var(--warning-color)',
                          background: t.refund_status === 'Approved' ? 'rgba(81,207,102,0.15)' : t.refund_status === 'Rejected' ? 'rgba(255,107,107,0.15)' : 'rgba(252,196,25,0.15)'
                        }}
                      >
                        {t.is_refund_request ? `Refund: ${t.refund_status}` : 'Complaint'}
                      </span>
                    </div>

                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{t.message}</p>

                    {t.is_refund_request && (
                      <div
                        style={{
                          padding: '0.8rem',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderLeft: '3px solid var(--primary-color)'
                        }}
                      >
                        <span>
                          Order Ref: <strong style={{ color: 'var(--primary-color)' }}>{t.order_id}</strong>
                        </span>
                        <span>
                          Amount Claimed: <strong style={{ color: 'var(--warning-color)' }}>${t.refund_amount.toFixed(2)}</strong>
                        </span>
                      </div>
                    )}

                    {t.photo_url && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a href={`http://localhost:8000${t.photo_url}`} target="_blank" rel="noreferrer">
                          <img
                            src={`http://localhost:8000${t.photo_url}`}
                            alt="Proof attachment"
                            style={{
                              maxWidth: '120px',
                              maxHeight: '120px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--surface-border)',
                              cursor: 'pointer'
                            }}
                          />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'order') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', maxWidth: '1200px', margin: '0 auto' }}>
        {renderHeader(`Welcome, ${customerName}!`, 'Step 1: Order your food')}
        {renderSubNav()}
        
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 2 }}>
            <FoodCatalog products={products} onAddProduct={handleAddProduct} />
          </div>

          <div className="glass-card flex-col" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Your Cart</h2>
            
            <div style={{ flex: 1, overflowY: 'auto' }} className="flex-col gap-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px' }}>
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
                    <button className="danger outline" style={{ padding: '0.2rem 0.5rem', border: 'none' }} onClick={() => handleRemoveItem(item.id)}>🗑️</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>Your cart is empty.</div>
              )}
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total Bill</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${totalBill.toFixed(2)}</span>
              </div>
              <button 
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: 'var(--primary-color)' }}
                onClick={handleProceedToPayment}
              >
                Checkout & Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', maxWidth: '800px', margin: '0 auto' }}>
        {renderHeader('Payment', 'Step 2: Complete your payment securely')}
        {renderSubNav()}
        
        <div className="glass-card flex-col gap-4">
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total Amount to Pay</span>
            {appliedDiscount > 0 && (
              <div style={{ color: 'var(--success-color)' }}>10% Coupon Discount Applied!</div>
            )}
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${finalTotal.toFixed(2)}</div>
          </div>

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

          <div>
            <h3 style={{ margin: '0 0 1rem' }}>Order Type</h3>
            <div className="flex gap-4">
              {(['Dine In', 'Walk Away'] as const).map(type => (
                <button
                  key={type}
                  className={orderType === type ? '' : 'outline'}
                  onClick={() => setOrderType(type)}
                  style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 1rem' }}>Select Payment Method</h3>
            <div className="flex gap-4">
              {(['Card', 'UPI'] as const).map(method => (
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
          </div>

          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
            <span style={{ fontSize: '3rem' }}>{paymentMethod === 'Card' ? '💳' : '📱'}</span>
            <p className="text-muted">
              {paymentMethod === 'Card' ? 'Enter card details (Mocked)' : 'Scan QR code to pay (Mocked)'}
            </p>
          </div>

          <div className="flex gap-4">
            <button className="outline" style={{ flex: 1, padding: '1rem' }} onClick={() => setStep('order')}>
              Back to Cart
            </button>
            <button style={{ flex: 2, padding: '1rem', background: 'var(--success-color)' }} onClick={handleCompletePayment}>
              Pay ${finalTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'reserve') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {renderHeader('Reserve Your Table', 'Step 3: Pick a table to dine in')}
        {renderSubNav()}

        {reservedTable && (
          <div style={{ background: 'rgba(81,207,102,0.1)', border: '2px solid var(--success-color)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--success-color)' }}>Your Reservation Confirmed</h3>
            <p style={{ margin: '0.5rem 0 0' }}>You have successfully reserved <strong>Table {reservedTable}</strong>. Please head to your table!</p>
          </div>
        )}

        {generatedCouponCode && (
          <div style={{ padding: '1.5rem', background: 'rgba(252,196,25,0.1)', border: '2px dashed #fcc419', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#fcc419' }}>🎁 You Earned a Coupon!</h3>
            <p style={{ margin: '0 0 1rem' }}>Since your order was $50+, use this code for 10% off your next order:</p>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>
              {generatedCouponCode}
            </div>
          </div>
        )}

        <div className="glass-card flex-col gap-2">
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Dine-in Tables</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}>
            {tables.map(table => {
              const isMine = table.number === reservedTable;
              let bgColor = 'rgba(81,207,102,0.1)';
              let borderColor = 'var(--success-color)';
              let displayStatus: string = table.status;
              let cursor = 'pointer';

              if (isMine) {
                bgColor = 'var(--primary-color)';
                borderColor = 'var(--primary-color)';
                displayStatus = 'Your Table';
              } else if (table.status === 'Reserved') {
                bgColor = 'rgba(250,82,82,0.1)';
                borderColor = 'var(--danger-color)';
                cursor = 'not-allowed';
              } else if (table.status === 'On Hold') {
                bgColor = 'rgba(252,196,25,0.1)';
                borderColor = '#fcc419';
                cursor = 'not-allowed';
                displayStatus = 'Unavailable';
              }

              return (
                <div
                  key={table.number}
                  onClick={() => handleTableClick(table.number, table.status)}
                  style={{
                    width: '100px', height: '100px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px', cursor: cursor,
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    transition: 'transform 0.2s',
                    opacity: (table.status !== 'Available' && !isMine) ? 0.6 : 1,
                    color: isMine ? '#fff' : 'inherit'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>T{table.number}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{displayStatus}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {renderHeader('Order Successful', 'Thank you for your order!')}
        {renderSubNav()}
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--success-color)', fontSize: '2rem' }}>🎉 Your Order is Placed!</h2>
          <p className="text-muted">Since you selected Walk Away (Takeout), you don't need to reserve a table. Your order is being prepared in the kitchen.</p>

          {generatedCouponCode && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(252,196,25,0.1)', border: '2px dashed #fcc419', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#fcc419' }}>🎁 You Earned a Coupon!</h3>
              <p style={{ margin: '0 0 1rem' }}>Use this code for 10% off your next order:</p>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>
                {generatedCouponCode}
              </div>
            </div>
          )}

          <button style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.2rem', background: 'var(--primary-color)' }} onClick={() => { setStep('order'); setGeneratedCouponCode(null); }}>
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};

export default CustomerPage;
