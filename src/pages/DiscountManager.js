// DISCOUNT SYSTEM - Not yet connected to app routes.
// To enable, add to App.js:
//   const DiscountManager = React.lazy(() => import('./pages/DiscountManager'));
//   <Route path="/vendor/discounts" element={<ProtectedRoute><VendorLayout><DiscountManager /></VendorLayout></ProtectedRoute>} />

import React, { useState } from 'react';
import { theme, styles, useIsMobile } from '../shared/theme';
import api from '../services/api';

// ── API (not live yet) ──────────────────────────────────────────────
const discountAPI = {
  getMachineDiscounts: (machineId) => api.get(`/discounts/machines/${machineId}`),
  createDiscount: (machineId, data) => api.post(`/discounts/machines/${machineId}`, data),
  updateDiscount: (discountId, data) => api.put(`/discounts/${discountId}`, data),
  deleteDiscount: (discountId) => api.delete(`/discounts/${discountId}`),
  getBalance: () => api.get('/discounts/balance'),
  loadBalance: (amount) => api.post('/discounts/balance/load', { amount }),
  getRedemptions: (params) => api.get('/discounts/redemptions', { params }),
  approveRedemption: (id) => api.put(`/discounts/redemptions/${id}/approve`),
  rejectRedemption: (id, reason) => api.put(`/discounts/redemptions/${id}/reject`, { reason }),
  getAnalytics: () => api.get('/discounts/analytics'),
};

// ── Mock Data ───────────────────────────────────────────────────────
const MOCK_MACHINES = [
  {
    id: 1,
    name: 'Break Room - Building A',
    location: '123 Main St, Floor 2',
    discounts: [
      { id: 101, productName: 'Honey Bun', type: 'percentage', value: 10, maxCap: 1.0, status: 'active', productPrice: 2.00 },
      { id: 102, productName: null, type: 'fixed', value: 0.50, maxCap: null, status: 'active', productPrice: null },
    ],
  },
  {
    id: 2,
    name: 'Lobby Machine',
    location: '456 Oak Ave',
    discounts: [
      { id: 103, productName: 'Doritos', type: 'percentage', value: 15, maxCap: 0.75, status: 'paused', productPrice: 1.75 },
      { id: 104, productName: 'Coke Zero', type: 'fixed', value: 0.25, maxCap: null, status: 'active', productPrice: 1.50 },
      { id: 105, productName: 'Snickers', type: 'percentage', value: 20, maxCap: 1.00, status: 'active', productPrice: 1.50 },
    ],
  },
  {
    id: 3,
    name: 'Gym Entrance',
    location: '789 Fitness Blvd',
    discounts: [],
  },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Honey Bun', price: 2.00 },
  { id: 2, name: 'Doritos', price: 1.75 },
  { id: 3, name: 'Coke Zero', price: 1.50 },
  { id: 4, name: 'Snickers', price: 1.50 },
  { id: 5, name: 'Gatorade', price: 2.25 },
  { id: 6, name: 'Lay\'s Classic', price: 1.50 },
  { id: 7, name: 'Kind Bar', price: 2.50 },
];

const MOCK_REDEMPTIONS = [
  { id: 201, customerName: 'Alex M.', productName: 'Honey Bun', purchasePrice: 2.00, rebateAmount: 0.20, machineName: 'Break Room - Building A', timestamp: '2026-03-14T09:32:00Z', status: 'pending', proofUrl: null },
  { id: 202, customerName: 'Jordan K.', productName: 'Coke Zero', purchasePrice: 1.50, rebateAmount: 0.25, machineName: 'Lobby Machine', timestamp: '2026-03-13T15:10:00Z', status: 'pending', proofUrl: 'https://placeholder.example/proof.jpg' },
  { id: 203, customerName: 'Sam R.', productName: 'Doritos', purchasePrice: 1.75, rebateAmount: 0.50, machineName: 'Break Room - Building A', timestamp: '2026-03-12T11:45:00Z', status: 'approved', proofUrl: null },
  { id: 204, customerName: 'Casey T.', productName: 'Snickers', purchasePrice: 1.50, rebateAmount: 0.30, machineName: 'Lobby Machine', timestamp: '2026-03-11T14:20:00Z', status: 'paid', proofUrl: null },
  { id: 205, customerName: 'Morgan L.', productName: 'Gatorade', purchasePrice: 2.25, rebateAmount: 0.50, machineName: 'Break Room - Building A', timestamp: '2026-03-10T08:55:00Z', status: 'rejected', proofUrl: null },
];

const MOCK_BALANCE = {
  current: 47.30,
  totalLoaded: 200.00,
  totalPaid: 152.70,
};

const MOCK_ANALYTICS = {
  totalRedemptionsMonth: 34,
  totalRebatesPaidMonth: 12.85,
  averageRebate: 0.38,
  mostPopularDiscount: '10% off Honey Bun',
  repeatCustomerRate: 42,
};

// ── Helpers ─────────────────────────────────────────────────────────
function formatDiscount(disc) {
  if (disc.type === 'percentage') return `${disc.value}% off`;
  return `$${disc.value.toFixed(2)} off`;
}

function computeRebatePreview(type, value, maxCap, price) {
  if (!price || price <= 0) return null;
  if (type === 'percentage') {
    const raw = (value / 100) * price;
    const capped = maxCap ? Math.min(raw, maxCap) : raw;
    return capped;
  }
  return value;
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  const month = d.toLocaleString('default', { month: 'short' });
  const day = d.getDate();
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${month} ${day}, ${h}:${mins} ${ampm}`;
}

// ── Component ───────────────────────────────────────────────────────
function DiscountManager() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('discounts');

  // Discounts tab state
  const [machines, setMachines] = useState(MOCK_MACHINES);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formMachineId, setFormMachineId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formType, setFormType] = useState('percentage');
  const [formValue, setFormValue] = useState('');
  const [formMaxCap, setFormMaxCap] = useState('1.00');

  // Redemptions tab state
  const [redemptions, setRedemptions] = useState(MOCK_REDEMPTIONS);
  const [redemptionFilter, setRedemptionFilter] = useState('all');

  // Balance tab state
  const [balance, setBalance] = useState(MOCK_BALANCE);
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);
  const [showLoadFunds, setShowLoadFunds] = useState(false);
  const [loadAmount, setLoadAmount] = useState('');

  // ── Discount actions ────────────────────────────────────────────
  function openAddForm(machineId) {
    setEditingDiscount(null);
    setFormMachineId(String(machineId));
    setFormProductId('');
    setFormType('percentage');
    setFormValue('');
    setFormMaxCap('1.00');
    setShowForm(true);
  }

  function openEditForm(machineId, discount) {
    setEditingDiscount(discount);
    setFormMachineId(String(machineId));
    setFormProductId(discount.productName ? String(MOCK_PRODUCTS.find(p => p.name === discount.productName)?.id || '') : '');
    setFormType(discount.type);
    setFormValue(String(discount.value));
    setFormMaxCap(discount.maxCap ? String(discount.maxCap) : '1.00');
    setShowForm(true);
  }

  function saveDiscount() {
    const machineId = Number(formMachineId);
    const product = formProductId ? MOCK_PRODUCTS.find(p => p.id === Number(formProductId)) : null;
    const val = parseFloat(formValue);
    if (!machineId || isNaN(val) || val <= 0) return;

    const newDiscount = {
      id: editingDiscount ? editingDiscount.id : Date.now(),
      productName: product ? product.name : null,
      type: formType,
      value: val,
      maxCap: formType === 'percentage' ? parseFloat(formMaxCap) || 1.0 : null,
      status: 'active',
      productPrice: product ? product.price : null,
    };

    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      if (editingDiscount) {
        return { ...m, discounts: m.discounts.map(d => d.id === editingDiscount.id ? newDiscount : d) };
      }
      return { ...m, discounts: [...m.discounts, newDiscount] };
    }));
    setShowForm(false);
  }

  function toggleDiscountStatus(machineId, discountId) {
    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      return {
        ...m,
        discounts: m.discounts.map(d => {
          if (d.id !== discountId) return d;
          return { ...d, status: d.status === 'active' ? 'paused' : 'active' };
        }),
      };
    }));
  }

  function removeDiscount(machineId, discountId) {
    setMachines(prev => prev.map(m => {
      if (m.id !== machineId) return m;
      return { ...m, discounts: m.discounts.filter(d => d.id !== discountId) };
    }));
  }

  // ── Redemption actions ──────────────────────────────────────────
  function approveRedemption(id) {
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  }

  function rejectRedemption(id) {
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  }

  const filteredRedemptions = redemptionFilter === 'all'
    ? redemptions
    : redemptions.filter(r => r.status === redemptionFilter);

  // ── Load funds ──────────────────────────────────────────────────
  function handleLoadFunds() {
    const amt = parseFloat(loadAmount);
    if (isNaN(amt) || amt < 25) return;
    setBalance(prev => ({
      ...prev,
      current: prev.current + amt,
      totalLoaded: prev.totalLoaded + amt,
    }));
    setLoadAmount('');
    setShowLoadFunds(false);
  }

  // ── Preview calculation ─────────────────────────────────────────
  const selectedProduct = formProductId ? MOCK_PRODUCTS.find(p => p.id === Number(formProductId)) : null;
  const previewPrice = selectedProduct ? selectedProduct.price : 2.00;
  const previewRebate = formValue ? computeRebatePreview(formType, parseFloat(formValue), formType === 'percentage' ? parseFloat(formMaxCap) || 1.0 : null, previewPrice) : null;

  // ── Status badge ────────────────────────────────────────────────
  function StatusBadge({ status }) {
    const colors = {
      active: { bg: theme.success + '22', color: theme.success },
      paused: { bg: theme.warning + '22', color: theme.warning },
      pending: { bg: theme.warning + '22', color: theme.warning },
      approved: { bg: theme.primary + '22', color: theme.primary },
      paid: { bg: theme.success + '22', color: theme.success },
      rejected: { bg: theme.danger + '22', color: theme.danger },
    };
    const c = colors[status] || colors.paused;
    return (
      <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  // ── Tab bar ─────────────────────────────────────────────────────
  const tabs = [
    { key: 'discounts', label: 'Discounts' },
    { key: 'redemptions', label: 'Redemptions' },
    { key: 'balance', label: 'Balance & Analytics' },
  ];

  // ── Styles (local) ─────────────────────────────────────────────
  const s = {
    banner: {
      backgroundColor: theme.warning + '18',
      border: `1px solid ${theme.warning}44`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '20px',
      color: theme.warning,
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
    },
    tabBar: {
      display: 'flex',
      gap: '4px',
      marginBottom: '20px',
      backgroundColor: theme.surface,
      borderRadius: '8px',
      padding: '4px',
      border: `1px solid ${theme.border}`,
    },
    tab: (active) => ({
      flex: 1,
      padding: '10px 12px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      backgroundColor: active ? theme.primary : 'transparent',
      color: active ? 'white' : theme.textSecondary,
      transition: 'all 0.2s',
    }),
    machineCard: {
      ...styles.card,
      marginBottom: '16px',
    },
    machineHeader: {
      marginBottom: '12px',
    },
    machineName: {
      fontSize: '16px',
      fontWeight: '700',
      color: theme.text,
      margin: 0,
    },
    machineLocation: {
      fontSize: '13px',
      color: theme.textMuted,
      marginTop: '2px',
    },
    discountRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      backgroundColor: theme.bg,
      borderRadius: '6px',
      marginBottom: '6px',
      flexWrap: 'wrap',
      gap: '8px',
    },
    discountInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      minWidth: 0,
    },
    discountProduct: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.text,
    },
    discountDesc: {
      fontSize: '13px',
      color: theme.textSecondary,
    },
    discountActions: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      flexShrink: 0,
    },
    smallBtn: (color) => ({
      padding: '6px 10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: color + '22',
      color: color,
      minHeight: '30px',
    }),
    emptySlot: {
      padding: '10px 12px',
      backgroundColor: theme.bg,
      borderRadius: '6px',
      marginBottom: '6px',
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: '13px',
      border: `1px dashed ${theme.border}`,
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '480px',
      maxHeight: '90vh',
      overflowY: 'auto',
      border: `1px solid ${theme.border}`,
    },
    formGroup: {
      marginBottom: '16px',
    },
    toggleGroup: {
      display: 'flex',
      gap: '0px',
      borderRadius: '6px',
      overflow: 'hidden',
      border: `1px solid ${theme.border}`,
    },
    toggleBtn: (active) => ({
      flex: 1,
      padding: '10px 16px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      backgroundColor: active ? theme.primary : theme.bg,
      color: active ? 'white' : theme.textSecondary,
      transition: 'all 0.2s',
    }),
    preview: {
      backgroundColor: theme.primary + '15',
      border: `1px solid ${theme.primary}33`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '16px',
      fontSize: '14px',
      color: theme.text,
    },
    redemptionCard: {
      ...styles.card,
      marginBottom: '12px',
    },
    filterBar: {
      display: 'flex',
      gap: '6px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    filterBtn: (active) => ({
      padding: '8px 14px',
      border: `1px solid ${active ? theme.primary : theme.border}`,
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      backgroundColor: active ? theme.primary + '22' : 'transparent',
      color: active ? theme.primary : theme.textSecondary,
    }),
    balanceCard: {
      ...styles.card,
      textAlign: 'center',
      marginBottom: '20px',
    },
    bigNumber: {
      fontSize: '36px',
      fontWeight: '800',
      color: theme.success,
      margin: '8px 0',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '20px',
    },
    statCard: {
      ...styles.card,
      textAlign: 'center',
      padding: '16px 12px',
    },
    statValue: {
      fontSize: '22px',
      fontWeight: '700',
      color: theme.text,
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: '12px',
      color: theme.textSecondary,
    },
    proofThumb: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      objectFit: 'cover',
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.bg,
    },
  };

  // ── Render: Discounts tab ───────────────────────────────────────
  function renderDiscountsTab() {
    return (
      <div>
        {machines.map(machine => {
          const activeCount = machine.discounts.filter(d => d.status === 'active').length;
          const emptySlots = 3 - machine.discounts.length;
          return (
            <div key={machine.id} style={s.machineCard}>
              <div style={s.machineHeader}>
                <p style={s.machineName}>{machine.name}</p>
                <p style={s.machineLocation}>{machine.location}</p>
              </div>

              {machine.discounts.map(disc => (
                <div key={disc.id} style={s.discountRow}>
                  <div style={s.discountInfo}>
                    <span style={s.discountProduct}>{disc.productName || 'Any Product'}</span>
                    <span style={s.discountDesc}>{formatDiscount(disc)}</span>
                  </div>
                  <div style={s.discountActions}>
                    <StatusBadge status={disc.status} />
                    <button
                      style={s.smallBtn(theme.primary)}
                      onClick={() => openEditForm(machine.id, disc)}
                    >
                      Edit
                    </button>
                    <button
                      style={s.smallBtn(disc.status === 'active' ? theme.warning : theme.success)}
                      onClick={() => toggleDiscountStatus(machine.id, disc.id)}
                    >
                      {disc.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      style={s.smallBtn(theme.danger)}
                      onClick={() => removeDiscount(machine.id, disc.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
                <div key={`empty-${i}`} style={s.emptySlot}>
                  Empty discount slot
                </div>
              ))}

              <button
                style={{
                  ...styles.button,
                  width: '100%',
                  marginTop: '8px',
                  opacity: activeCount >= 3 ? 0.5 : 1,
                }}
                disabled={activeCount >= 3}
                onClick={() => openAddForm(machine.id)}
              >
                {activeCount >= 3 ? 'Max 3 discounts reached' : 'Add Discount'}
              </button>
            </div>
          );
        })}

        {/* Add / Edit Discount Modal */}
        {showForm && (
          <div style={s.modal} onClick={() => setShowForm(false)}>
            <div style={s.modalContent} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 20px', color: theme.text, fontSize: '18px' }}>
                {editingDiscount ? 'Edit Discount' : 'Add Discount'}
              </h3>

              {/* Machine select */}
              <div style={s.formGroup}>
                <label style={styles.label}>Machine</label>
                <select
                  style={styles.input}
                  value={formMachineId}
                  onChange={e => setFormMachineId(e.target.value)}
                >
                  <option value="">Select machine...</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Product select */}
              <div style={s.formGroup}>
                <label style={styles.label}>Product</label>
                <select
                  style={styles.input}
                  value={formProductId}
                  onChange={e => setFormProductId(e.target.value)}
                >
                  <option value="">Any Product</option>
                  {MOCK_PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* Discount type toggle */}
              <div style={s.formGroup}>
                <label style={styles.label}>Discount Type</label>
                <div style={s.toggleGroup}>
                  <button
                    style={s.toggleBtn(formType === 'percentage')}
                    onClick={() => setFormType('percentage')}
                  >
                    Percentage
                  </button>
                  <button
                    style={s.toggleBtn(formType === 'fixed')}
                    onClick={() => setFormType('fixed')}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Discount value */}
              <div style={s.formGroup}>
                <label style={styles.label}>
                  {formType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step={formType === 'percentage' ? '1' : '0.01'}
                  placeholder={formType === 'percentage' ? 'e.g. 10' : 'e.g. 0.50'}
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                />
              </div>

              {/* Max cap (percentage only) */}
              {formType === 'percentage' && (
                <div style={s.formGroup}>
                  <label style={styles.label}>Max Cap ($)</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1.00"
                    value={formMaxCap}
                    onChange={e => setFormMaxCap(e.target.value)}
                  />
                </div>
              )}

              {/* Preview */}
              {previewRebate !== null && parseFloat(formValue) > 0 && (
                <div style={s.preview}>
                  Customers will get ${previewRebate.toFixed(2)} back on a ${previewPrice.toFixed(2)} {selectedProduct ? selectedProduct.name : 'purchase'}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{ ...styles.button, flex: 1 }}
                  onClick={saveDiscount}
                >
                  {editingDiscount ? 'Update' : 'Save'}
                </button>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Redemptions tab ─────────────────────────────────────
  function renderRedemptionsTab() {
    const filters = ['all', 'pending', 'approved', 'paid', 'rejected'];
    return (
      <div>
        <div style={s.filterBar}>
          {filters.map(f => (
            <button
              key={f}
              style={s.filterBtn(redemptionFilter === f)}
              onClick={() => setRedemptionFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredRedemptions.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '32px', color: theme.textMuted }}>
            No redemptions found
          </div>
        )}

        {filteredRedemptions.map(r => (
          <div key={r.id} style={s.redemptionCard}>
            <div style={{ ...styles.flexBetween, marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: theme.text, fontSize: '15px' }}>{r.customerName}</span>
              <StatusBadge status={r.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: '10px' }}>
              <div>
                <span style={styles.textMuted}>Product</span>
                <div style={{ color: theme.text, fontSize: '14px' }}>{r.productName}</div>
              </div>
              <div>
                <span style={styles.textMuted}>Purchase Price</span>
                <div style={{ color: theme.text, fontSize: '14px' }}>${r.purchasePrice.toFixed(2)}</div>
              </div>
              <div>
                <span style={styles.textMuted}>Rebate</span>
                <div style={{ color: theme.success, fontSize: '14px', fontWeight: '700' }}>${r.rebateAmount.toFixed(2)}</div>
              </div>
              <div>
                <span style={styles.textMuted}>Machine</span>
                <div style={{ color: theme.text, fontSize: '14px' }}>{r.machineName}</div>
              </div>
            </div>

            <div style={{ ...styles.flexBetween, flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: theme.textMuted }}>{formatTimestamp(r.timestamp)}</span>
                {r.proofUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ ...s.proofThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: theme.textMuted }}>
                      Proof
                    </div>
                  </div>
                )}
              </div>

              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    style={{ ...styles.button, ...styles.buttonSuccess, padding: '8px 16px', fontSize: '13px', minHeight: '36px' }}
                    onClick={() => approveRedemption(r.id)}
                  >
                    Approve
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.buttonDanger, padding: '8px 16px', fontSize: '13px', minHeight: '36px' }}
                    onClick={() => rejectRedemption(r.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render: Balance & Analytics tab ─────────────────────────────
  function renderBalanceTab() {
    return (
      <div>
        {/* Balance Card */}
        <div style={s.balanceCard}>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary }}>Rebate Balance</p>
          <p style={s.bigNumber}>${balance.current.toFixed(2)}</p>

          {balance.current < 10 && (
            <div style={{ backgroundColor: theme.danger + '18', border: `1px solid ${theme.danger}44`, borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', color: theme.danger, fontSize: '13px', fontWeight: '600' }}>
              Low balance -- load funds to keep discounts active
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>Total Loaded</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text }}>${balance.totalLoaded.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>Total Paid</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text }}>${balance.totalPaid.toFixed(2)}</div>
            </div>
          </div>

          {!showLoadFunds ? (
            <button
              style={{ ...styles.button, ...styles.buttonSuccess }}
              onClick={() => setShowLoadFunds(true)}
            >
              Load Funds
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                style={{ ...styles.input, width: '140px', textAlign: 'center' }}
                type="number"
                min="25"
                step="1"
                placeholder="Min $25"
                value={loadAmount}
                onChange={e => setLoadAmount(e.target.value)}
              />
              <button
                style={{ ...styles.button, ...styles.buttonSuccess, padding: '12px 20px' }}
                onClick={handleLoadFunds}
              >
                Add
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonSecondary, padding: '12px 20px' }}
                onClick={() => { setShowLoadFunds(false); setLoadAmount(''); }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Analytics */}
        <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Analytics This Month</h3>
        <div style={s.statGrid}>
          <div style={s.statCard}>
            <div style={s.statValue}>{analytics.totalRedemptionsMonth}</div>
            <div style={s.statLabel}>Redemptions</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>${analytics.totalRebatesPaidMonth.toFixed(2)}</div>
            <div style={s.statLabel}>Rebates Paid</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>${analytics.averageRebate.toFixed(2)}</div>
            <div style={s.statLabel}>Avg Rebate</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statValue, fontSize: '16px' }}>{analytics.mostPopularDiscount}</div>
            <div style={s.statLabel}>Most Popular</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statValue}>{analytics.repeatCustomerRate}%</div>
            <div style={s.statLabel}>Repeat Customers</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Preview banner */}
      <div style={s.banner}>
        Discount System (Preview) -- This feature is coming soon
      </div>

      {/* Page title */}
      <h2 style={{ margin: '0 0 16px', color: theme.text, fontSize: '20px', fontWeight: '700' }}>
        Discount Manager
      </h2>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={s.tab(activeTab === t.key)}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'discounts' && renderDiscountsTab()}
      {activeTab === 'redemptions' && renderRedemptionsTab()}
      {activeTab === 'balance' && renderBalanceTab()}
    </div>
  );
}

export default DiscountManager;
