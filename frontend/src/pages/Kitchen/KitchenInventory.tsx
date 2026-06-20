import React, { useState, useEffect } from 'react';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api';
import './KitchenInventory.css';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  is_scarce: boolean;
  expiry_date: string | null;
  notes: string | null;
  last_updated: string;
}

const KitchenInventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'scarce' | 'expiring'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('units');
  const [isScarce, setIsScarce] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentItemId(null);
    setName('');
    setQuantity(0);
    setUnit('units');
    setIsScarce(false);
    setExpiryDate('');
    setNotes('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setModalMode('edit');
    setCurrentItemId(item.id);
    setName(item.name);
    setQuantity(item.quantity);
    setUnit(item.unit || 'units');
    setIsScarce(item.is_scarce);
    setExpiryDate(item.expiry_date ? item.expiry_date.substring(0, 10) : '');
    setNotes(item.notes || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Item name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      quantity: Number(quantity),
      unit: unit.trim() || null,
      is_scarce: isScarce,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      notes: notes.trim() || null,
    };

    try {
      if (modalMode === 'add') {
        await createInventoryItem(payload);
      } else if (currentItemId !== null) {
        await updateInventoryItem(currentItemId, payload);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'An error occurred while saving';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(id);
        setIsModalOpen(false);
        fetchInventory();
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }
  };

  const handleQuickQtyChange = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      // Optimitistically update UI
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
      await updateInventoryItem(item.id, { quantity: newQty });
    } catch (err) {
      console.error('Failed to update quantity:', err);
      fetchInventory(); // revert
    }
  };

  const handleQuickScarcityToggle = async (item: InventoryItem) => {
    const newScarce = !item.is_scarce;
    try {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_scarce: newScarce } : i));
      await updateInventoryItem(item.id, { is_scarce: newScarce });
    } catch (err) {
      console.error('Failed to toggle scarcity:', err);
      fetchInventory();
    }
  };

  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const now = new Date();
    // Reset hours to compare dates only
    expiry.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (dateStr: string | null) => {
    const days = getDaysUntilExpiry(dateStr);
    return days !== null && days >= 0 && days <= 7;
  };

  const isExpired = (dateStr: string | null) => {
    const days = getDaysUntilExpiry(dateStr);
    return days !== null && days < 0;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filter === 'scarce') return item.is_scarce;
    if (filter === 'expiring') return isExpiringSoon(item.expiry_date) || isExpired(item.expiry_date);
    return true;
  });

  return (
    <div className="inventory-section">
      <div className="inventory-header-bar">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="Search stock items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <div className="tab-filters">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Items ({items.length})
            </button>
            <button
              className={`filter-tab ${filter === 'scarce' ? 'active' : ''}`}
              onClick={() => setFilter('scarce')}
            >
              Scarce ({items.filter(i => i.is_scarce).length})
            </button>
            <button
              className={`filter-tab ${filter === 'expiring' ? 'active' : ''}`}
              onClick={() => setFilter('expiring')}
            >
              Expiring/Expired ({items.filter(i => isExpiringSoon(i.expiry_date) || isExpired(i.expiry_date)).length})
            </button>
          </div>
        </div>
        
        <button className="add-item-btn" onClick={openAddModal}>
          ➕ Add New Item
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading inventory data...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-inventory">
          <div className="empty-box-icon">📦</div>
          <h3>No inventory items found</h3>
          <p>Try refining your search or add a new stock item.</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map(item => {
            const expired = isExpired(item.expiry_date);
            const expiringSoon = isExpiringSoon(item.expiry_date);
            const daysLeft = getDaysUntilExpiry(item.expiry_date);
            
            return (
              <div 
                key={item.id} 
                className={`inventory-card glass-card ${item.is_scarce ? 'card-scarce' : ''} ${expired ? 'card-expired' : ''}`}
              >
                <div className="card-header">
                  <h3 className="item-title">{item.name}</h3>
                  <div className="badges">
                    {item.is_scarce && <span className="badge scarce-badge">Low Stock</span>}
                    {expired && <span className="badge expired-badge">Expired</span>}
                    {!expired && expiringSoon && (
                      <span className="badge expiring-badge">
                        Expiring in {daysLeft}d
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-qty-row">
                  <div className="qty-display">
                    <span className="qty-number">{item.quantity}</span>
                    <span className="qty-unit">{item.unit || ''}</span>
                  </div>
                  
                  <div className="quick-qty-controls">
                    <button 
                      onClick={() => handleQuickQtyChange(item, -1)}
                      className="qty-btn dec-btn"
                      title="Decrease quantity"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => handleQuickQtyChange(item, 1)}
                      className="qty-btn inc-btn"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {item.notes && <p className="item-notes">{item.notes}</p>}

                <div className="card-meta">
                  <div className="meta-info">
                    {item.expiry_date && (
                      <span className="expiry-info">
                        📅 Exp: {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className="update-info">
                      Updated: {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      onClick={() => handleQuickScarcityToggle(item)}
                      className={`scarcity-toggle-btn ${item.is_scarce ? 'is-active' : ''}`}
                      title={item.is_scarce ? "Mark as Available" : "Mark as Scarce"}
                    >
                      ⚠️
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="edit-btn"
                      title="Edit item details"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Stock Item' : 'Edit Stock Item'}</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-form">
              {errorMessage && <div className="modal-error">{errorMessage}</div>}
              
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tomato Sauce, Fresh Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={modalMode === 'edit'} // Name is generally unique/fixed
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="0"
                  />
                </div>
                
                <div className="form-group half">
                  <label>Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="units">Units</option>
                    <option value="kg">kg</option>
                    <option value="liters">Liters</option>
                    <option value="packs">Packs</option>
                    <option value="boxes">Boxes</option>
                    <option value="g">Grams</option>
                    <option value="ml">Milliliters</option>
                  </select>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isScarce}
                    onChange={(e) => setIsScarce(e.target.checked)}
                  />
                  <span>Mark as scarce (needs restock)</span>
                </label>
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notes / Storage Instructions</label>
                <textarea
                  placeholder="e.g. Keep refrigerated, Shelf 3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                {modalMode === 'edit' && currentItemId !== null && (
                  <button
                    type="button"
                    className="danger delete-modal-btn"
                    onClick={() => handleDelete(currentItemId)}
                  >
                    🗑️ Delete Item
                  </button>
                )}
                
                <div className="right-actions">
                  <button
                    type="button"
                    className="outline cancel-modal-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-modal-btn">
                    {modalMode === 'add' ? 'Add Item' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenInventory;
