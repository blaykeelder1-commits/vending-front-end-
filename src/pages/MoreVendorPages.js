import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vendorAPI } from '../services/api';
import { theme, styles, useIsMobile } from '../shared/theme';
import { useToast } from '../shared/toast';

function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const toast = useToast();

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getSuggestions(filter !== 'all' ? { status: filter } : {});
      setSuggestions(response.data?.data?.suggestions || []);
    } catch (err) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await vendorAPI.updateSuggestion(id, { status });
      toast.success(`Suggestion marked as ${status}`);
      loadSuggestions();
    } catch (err) {
      toast.error('Failed to update suggestion');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: theme.warning + '20', color: theme.warning },
      reviewed: { bg: theme.primary + '20', color: theme.primary },
      added: { bg: theme.success + '20', color: theme.success },
      dismissed: { bg: theme.textMuted + '20', color: theme.textMuted },
    };
    const c = colors[status] || colors.pending;
    return {
      padding: '4px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: c.bg,
      color: c.color,
      textTransform: 'capitalize',
    };
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading suggestions...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Product Suggestions</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            Customer suggestions from QR code polls
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['pending', 'reviewed', 'added', 'dismissed', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...styles.button,
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: filter === status ? theme.primary : theme.surfaceHover,
                textTransform: 'capitalize',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: theme.textSecondary }}>
            {filter === 'all' ? 'No suggestions yet.' : `No ${filter} suggestions.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>"{suggestion.suggestion_text}"</h3>
                  <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
                    From: {suggestion.machine_name} • {new Date(suggestion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={getStatusBadge(suggestion.status)}>{suggestion.status}</span>
              </div>

              {suggestion.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'reviewed')}
                    style={{ ...styles.button, ...styles.buttonSecondary, flex: 1, fontSize: '14px' }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'added')}
                    style={{ ...styles.button, ...styles.buttonSuccess, flex: 1, fontSize: '14px' }}
                  >
                    Added to Machine
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'dismissed')}
                    style={{ ...styles.button, backgroundColor: theme.textMuted, flex: 1, fontSize: '14px' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPIRING PRODUCTS
// ============================================

// ============================================
// INVENTORY MANAGEMENT PAGE
// ============================================
function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState({});
  // Purchase form
  const [purchaseProductId, setPurchaseProductId] = useState('');
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Transaction filters
  const [txnFilter, setTxnFilter] = useState({ productId: '', type: '' });
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(0);
  // Adjust modal
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const toast = useToast();

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, prodRes] = await Promise.allSettled([
        vendorAPI.getInventory(),
        vendorAPI.getProducts(),
      ]);
      if (invRes.status === 'fulfilled') {
        setInventory(invRes.value.data?.data?.inventory || []);
        setSummary(invRes.value.data?.data?.summary || {});
      }
      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value.data?.data?.products || []);
      }
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadTransactions = useCallback(async () => {
    try {
      const params = { limit: 50, offset: txnPage * 50 };
      if (txnFilter.productId) params.productId = txnFilter.productId;
      if (txnFilter.type) params.type = txnFilter.type;
      const res = await vendorAPI.getInventoryTransactions(params);
      setTransactions(res.data?.data?.transactions || []);
      setTxnTotal(res.data?.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  }, [txnFilter, txnPage, toast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseProductId || !purchaseQuantity) return;
    setSubmitting(true);
    try {
      await vendorAPI.logPurchase({
        productId: parseInt(purchaseProductId),
        quantity: parseInt(purchaseQuantity),
        notes: purchaseNotes || null,
      });
      toast.success('Purchase logged successfully');
      setPurchaseProductId('');
      setPurchaseQuantity('');
      setPurchaseNotes('');
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleThresholdUpdate = async (productId, newThreshold) => {
    try {
      await vendorAPI.updateReorderThreshold(productId, parseInt(newThreshold));
      setInventory(prev => prev.map(item =>
        item.product_id === productId ? { ...item, reorder_threshold: parseInt(newThreshold) } : item
      ));
      toast.success('Threshold updated');
    } catch (err) {
      toast.error('Failed to update threshold');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustProduct || !adjustQuantity || !adjustNotes) return;
    setSubmitting(true);
    try {
      await vendorAPI.adjustInventory({
        productId: adjustProduct.product_id,
        quantity: parseInt(adjustQuantity),
        notes: adjustNotes,
      });
      toast.success('Inventory adjusted');
      setAdjustProduct(null);
      setAdjustQuantity('');
      setAdjustNotes('');
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      ok: { bg: `${theme.success}20`, color: theme.success, label: 'OK' },
      low: { bg: `${theme.warning}20`, color: theme.warning, label: 'Low' },
      out: { bg: `${theme.danger}20`, color: theme.danger, label: 'Out' },
    };
    const c = colors[status] || colors.ok;
    return (
      <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>{c.label}</span>
    );
  };

  const getTxnTypeBadge = (type) => {
    const colors = {
      purchase: { bg: `${theme.success}20`, color: theme.success, label: 'Purchase' },
      dispersal_to_machine: { bg: `${theme.primary}20`, color: theme.primary, label: 'To Machine' },
      direct_to_machine: { bg: '#06b6d420', color: theme.secondary, label: 'Direct' },
      sold_from_machine: { bg: `${theme.danger}20`, color: theme.danger, label: 'Sold' },
      adjustment: { bg: `${theme.warning}20`, color: theme.warning, label: 'Adjustment' },
    };
    const c = colors[type] || { bg: `${theme.textMuted}20`, color: theme.textMuted, label: type };
    return (
      <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>{c.label}</span>
    );
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Central Inventory</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            Track stock levels and purchases
          </p>
        </div>
        <button onClick={loadInventory} style={{ ...styles.button, ...styles.buttonSecondary }}>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '8px' : '12px', marginBottom: '24px' }}>
        <div style={{ ...styles.card, textAlign: 'center', borderColor: theme.primary, padding: isMobile ? '10px 6px' : undefined }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: theme.primary }}>{summary.totalInField || 0}</div>
          <div style={{ color: theme.textSecondary, fontSize: isMobile ? '11px' : '13px' }}>In Machines</div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', borderColor: theme.success, padding: isMobile ? '10px 6px' : undefined }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: theme.success }}>{summary.healthy || 0}</div>
          <div style={{ color: theme.textSecondary, fontSize: isMobile ? '11px' : '13px' }}>Stocked</div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', borderColor: theme.warning, padding: isMobile ? '10px 6px' : undefined }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: theme.warning }}>{summary.lowStock || 0}</div>
          <div style={{ color: theme.textSecondary, fontSize: isMobile ? '11px' : '13px' }}>Low Stock</div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', borderColor: theme.danger, padding: isMobile ? '10px 6px' : undefined }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: theme.danger }}>{summary.outOfStock || 0}</div>
          <div style={{ color: theme.textSecondary, fontSize: isMobile ? '11px' : '13px' }}>Out of Stock</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'stock', label: 'Stock Levels' },
          { key: 'purchase', label: 'Log Purchase' },
          { key: 'history', label: 'Transaction History' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.button,
              backgroundColor: activeTab === tab.key ? theme.primary : 'transparent',
              border: activeTab === tab.key ? 'none' : `1px solid ${theme.border}`,
              fontSize: '14px',
              padding: '8px 16px',
              minHeight: '44px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock Levels Tab */}
      {activeTab === 'stock' && (
        <div>
          {inventory.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
              <p style={{ color: theme.textSecondary, margin: '0 0 12px 0' }}>
                No inventory tracked yet. Log your first purchase to get started.
              </p>
              <button onClick={() => setActiveTab('purchase')} style={styles.button}>
                Log a Purchase
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inventory.map(item => (
                <div key={item.id} style={{
                  ...styles.card,
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: isMobile ? undefined : 1, minWidth: isMobile ? undefined : '200px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: theme.border, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: theme.textMuted }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : <span style={{ fontSize: '14px', color: '#4a4a6a' }}>--</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', wordBreak: 'break-word' }}>{item.product_name}</div>
                      {item.category && <div style={{ color: theme.textMuted, fontSize: '12px' }}>{item.category}</div>}
                    </div>
                    {getStatusBadge(item.stock_status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', justifyContent: isMobile ? 'space-between' : undefined, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 'bold', color: theme.primary }}>{item.in_field || 0}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>In Machines</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 'bold', color: item.sold_30d > 0 ? theme.success : theme.textMuted }}>{item.sold_30d || 0}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>Sold/30d</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: isMobile ? '15px' : '18px', fontWeight: 'bold',
                        color: item.suggested_reorder > (item.in_field || 0) ? theme.warning : theme.success,
                      }}>
                        {item.suggested_reorder || 0}
                      </div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>Reorder</div>
                    </div>
                    <button
                      onClick={() => { setAdjustProduct(item); setAdjustQuantity(''); setAdjustNotes(''); }}
                      style={{ ...styles.button, ...styles.buttonSecondary, fontSize: '12px', padding: '8px 12px', minHeight: '44px' }}
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adjust Modal */}
          {adjustProduct && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
              <div style={{ ...styles.card, maxWidth: '400px', width: '100%' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Adjust: {adjustProduct.product_name}</h3>
                <p style={{ color: theme.textSecondary, margin: '0 0 16px 0' }}>
                  Current stock: {adjustProduct.quantity_on_hand}
                </p>
                <form onSubmit={handleAdjust}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.label}>Quantity Change (use negative to reduce)</label>
                    <input
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(e.target.value)}
                      style={{ ...styles.input, width: '100%' }}
                      placeholder="e.g. -5 or +10"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Reason (required)</label>
                    <input
                      type="text"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      style={{ ...styles.input, width: '100%' }}
                      placeholder="e.g. Damaged, count correction, expired"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setAdjustProduct(null)} style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} style={{ ...styles.button, flex: 1 }}>
                      {submitting ? 'Saving...' : 'Apply Adjustment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Purchase Tab */}
      {activeTab === 'purchase' && (
        <div style={{ ...styles.card, maxWidth: '500px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Log a Bulk Purchase</h3>
          <form onSubmit={handlePurchase}>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Product</label>
              <select
                value={purchaseProductId}
                onChange={(e) => setPurchaseProductId(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
                required
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_name}{p.category ? ` (${p.category})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Quantity Purchased</label>
              <input
                type="number"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
                min="1"
                placeholder="e.g. 50"
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Notes (optional)</label>
              <input
                type="text"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
                placeholder="e.g. Costco bulk buy, Sam's Club"
              />
            </div>
            <button type="submit" disabled={submitting} style={{ ...styles.button, width: '100%' }}>
              {submitting ? 'Logging...' : 'Log Purchase'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <select
              value={txnFilter.productId}
              onChange={(e) => { setTxnFilter(prev => ({ ...prev, productId: e.target.value })); setTxnPage(0); }}
              style={{ ...styles.input, width: 'auto', minWidth: '150px' }}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
            <select
              value={txnFilter.type}
              onChange={(e) => { setTxnFilter(prev => ({ ...prev, type: e.target.value })); setTxnPage(0); }}
              style={{ ...styles.input, width: 'auto', minWidth: '150px' }}
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="dispersal_to_machine">Dispersal to Machine</option>
              <option value="direct_to_machine">Direct to Machine</option>
              <option value="sold_from_machine">Sold</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {transactions.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
              <p style={{ color: theme.textSecondary }}>No transactions found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map(txn => (
                <div key={txn.id} style={{ ...styles.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', wordBreak: 'break-word' }}>{txn.product_name}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {getTxnTypeBadge(txn.transaction_type)}
                      {txn.machine_name && (
                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>{txn.machine_name}</span>
                      )}
                    </div>
                    {txn.notes && <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '4px' }}>{txn.notes}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: txn.quantity > 0 ? theme.success : theme.danger, fontSize: '16px' }}>
                      {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                      {txn.quantity_before} to {txn.quantity_after}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                      {new Date(txn.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {txnTotal > 50 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  <button
                    disabled={txnPage === 0}
                    onClick={() => setTxnPage(p => p - 1)}
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                  >
                    Previous
                  </button>
                  <span style={{ ...styles.badge, display: 'flex', alignItems: 'center' }}>
                    Page {txnPage + 1} of {Math.ceil(txnTotal / 50)}
                  </span>
                  <button
                    disabled={(txnPage + 1) * 50 >= txnTotal}
                    onClick={() => setTxnPage(p => p + 1)}
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpiringProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const toast = useToast();
  const isMobile = useIsMobile();

  const loadExpiringProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getExpiringProducts(days);
      setProducts(response.data?.data?.products || []);
    } catch (err) {
      toast.error('Failed to load expiring products');
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => {
    loadExpiringProducts();
  }, [loadExpiringProducts]);

  const handleUpdateExpiration = async (machineId, inventoryId, newDate) => {
    try {
      await vendorAPI.updateExpirationDate(machineId, inventoryId, newDate);
      toast.success('Expiration date updated');
      loadExpiringProducts();
    } catch (err) {
      toast.error('Failed to update expiration date');
    }
  };

  const getDaysUntil = (date) => {
    const now = new Date();
    const expDate = new Date(date);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 3) return theme.danger;
    if (daysLeft <= 7) return theme.warning;
    return theme.textSecondary;
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading expiring products...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : undefined }}>Expiring Products</h1>
          <p style={{ color: theme.textSecondary, margin: 0, fontSize: isMobile ? '13px' : undefined }}>
            Products expiring within {days} days across all machines
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: theme.textSecondary, fontSize: isMobile ? '13px' : undefined }}>Show next:</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ ...styles.input, width: 'auto', padding: '8px 16px', minHeight: '44px' }}
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ margin: '0 0 8px 0' }}>No Expiring Products</h2>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            No products are expiring within the next {days} days.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {products.map(product => {
            const daysLeft = getDaysUntil(product.expiration_date);
            const urgencyColor = getUrgencyColor(daysLeft);

            return (
              <div key={`${product.machine_id}-${product.inventory_id}`} style={{
                ...styles.card,
                borderLeft: `4px solid ${urgencyColor}`
              }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'start', gap: isMobile ? '12px' : '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', wordBreak: 'break-word', fontSize: isMobile ? '16px' : undefined }}>{product.product_name}</h3>
                    <p style={{ color: theme.textMuted, margin: '0 0 4px 0', fontSize: '14px' }}>
                      {product.machine_name} • Stock: {product.current_stock}
                    </p>
                    <p style={{ color: urgencyColor, margin: 0, fontSize: '14px', fontWeight: '600' }}>
                      {daysLeft <= 0 ? 'EXPIRED' : `Expires in ${daysLeft} days`} ({new Date(product.expiration_date).toLocaleDateString()})
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <input
                      type="date"
                      defaultValue={product.expiration_date?.split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateExpiration(product.machine_id, product.inventory_id, e.target.value);
                        }
                      }}
                      style={{ ...styles.input, width: 'auto', padding: '8px', minHeight: '44px' }}
                    />
                    <Link
                      to={`/vendor/machines/${product.machine_id}`}
                      style={{ ...styles.button, textDecoration: 'none', padding: '8px 16px', fontSize: '14px', minHeight: '44px', display: 'flex', alignItems: 'center' }}
                    >
                      View Machine
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div style={{ ...styles.card, marginTop: '24px', backgroundColor: theme.warning + '10', borderLeft: `4px solid ${theme.warning}` }}>
        <h3 style={{ margin: '0 0 8px 0', color: theme.warning }}>Tips for Managing Expiring Products</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: theme.textSecondary, lineHeight: '1.8' }}>
          <li>Move expiring products to higher-traffic machines</li>
          <li>Consider promotional pricing for products nearing expiration</li>
          <li>Use the Route Plan to optimize redistribution</li>
          <li>Update expiration dates when restocking</li>
        </ul>
      </div>
    </div>
  );
}

export { Suggestions, InventoryManagement, ExpiringProducts };
