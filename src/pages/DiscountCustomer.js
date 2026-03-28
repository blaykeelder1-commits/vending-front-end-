// DISCOUNT CUSTOMER FLOW - Not yet connected to the live customer pages.
// To enable, import this component in CustomerPages.js and render it
// after the poll completion screen, passing machineId as a prop.

import React, { useState, useEffect, useCallback } from 'react';
import { theme, styles } from '../shared/theme';

// ============================================
// MOCK DATA
// ============================================

const MOCK_DISCOUNTS = [
  {
    id: 'disc_1',
    productName: 'Honey Bun',
    isAnyProduct: false,
    discountType: 'percentage',
    discountValue: 10,
    expectedPrice: 2.00,
    rebateAmount: 0.20,
    description: 'Get 10% back',
    example: 'Buy a $2.00 Honey Bun, get $0.20 back',
  },
  {
    id: 'disc_2',
    productName: null,
    isAnyProduct: true,
    discountType: 'flat',
    discountValue: 0.50,
    expectedPrice: null,
    rebateAmount: 0.50,
    description: 'Get $0.50 back',
    example: 'Buy any product and get $0.50 back',
  },
  {
    id: 'disc_3',
    productName: 'Celsius Energy',
    isAnyProduct: false,
    discountType: 'percentage',
    discountValue: 15,
    expectedPrice: 3.00,
    rebateAmount: 0.45,
    description: 'Get 15% back',
    example: 'Buy a $3.00 Celsius Energy, get $0.45 back',
  },
];

const MOCK_HISTORY = [
  { id: 'r1', date: '2026-03-10', product: 'Honey Bun', rebateAmount: 0.20, status: 'Paid' },
  { id: 'r2', date: '2026-03-07', product: 'Celsius Energy', rebateAmount: 0.45, status: 'Paid' },
  { id: 'r3', date: '2026-03-13', product: 'Any Product', rebateAmount: 0.50, status: 'Pending' },
];

// ============================================
// STUB API HELPERS
// ============================================

function stubDelay(ms = 800) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchDiscounts(/* machineId */) {
  await stubDelay(600);
  return MOCK_DISCOUNTS;
}

async function saveCustomerAccount(/* data */) {
  await stubDelay(500);
  return { customerId: 'cust_' + Date.now() };
}

async function claimDiscount(/* discountId, customerId */) {
  await stubDelay(400);
  return { claimId: 'claim_' + Date.now() };
}

async function submitProof(/* claimId, proofData */) {
  await stubDelay(700);
  return { success: true };
}

async function fetchHistory(/* customerId */) {
  await stubDelay(500);
  return MOCK_HISTORY;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const CUSTOMER_KEY = 'iddi_discount_customer';

function getSavedCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCustomer(data) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
}

// ============================================
// SHARED STYLES
// ============================================

const pageStyle = {
  ...styles.page,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: '20px 16px',
  maxWidth: '480px',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '24px',
};

const titleStyle = {
  margin: '0 0 8px 0',
  fontSize: '22px',
  fontWeight: '700',
  color: theme.text,
};

const subtextStyle = {
  margin: 0,
  color: theme.textSecondary,
  fontSize: '14px',
  lineHeight: '1.5',
};

const bigButtonStyle = {
  ...styles.button,
  width: '100%',
  padding: '16px',
  fontSize: '16px',
  fontWeight: '700',
  borderRadius: '10px',
  minHeight: '52px',
};

const cardStyle = {
  ...styles.card,
  padding: '20px',
  borderRadius: '12px',
  marginBottom: '12px',
};

const inputGroupStyle = {
  marginBottom: '16px',
};

const labelStyle = {
  ...styles.label,
  fontWeight: '500',
  marginBottom: '6px',
};

const inputStyle = {
  ...styles.input,
  borderRadius: '10px',
  padding: '14px 16px',
  fontSize: '16px',
};

const helperTextStyle = {
  margin: '4px 0 0 0',
  fontSize: '12px',
  color: theme.textMuted,
};

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: theme.primary,
  fontSize: '14px',
  cursor: 'pointer',
  padding: '8px',
  fontWeight: '500',
};

const footerStyle = {
  textAlign: 'center',
  marginTop: 'auto',
  paddingTop: '24px',
  paddingBottom: '16px',
  borderTop: `1px solid ${theme.border}`,
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: `3px solid ${theme.border}`,
  borderTopColor: theme.primary,
  borderRadius: '50%',
  margin: '0 auto 16px',
};

// ============================================
// MAIN COMPONENT
// ============================================

function DiscountCustomerFlow({ machineId }) {
  // Steps: 'loading' | 'discounts' | 'account' | 'confirmed' | 'proof' | 'done' | 'history'
  const [step, setStep] = useState('loading');
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [customer, setCustomer] = useState(getSavedCustomer);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  // Account form
  const [accountName, setAccountName] = useState('');
  const [accountContact, setAccountContact] = useState('');
  const [accountZelle, setAccountZelle] = useState('');

  // Proof form
  const [proofAmount, setProofAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [noReceipt, setNoReceipt] = useState(false);

  // Load discounts on mount
  useEffect(() => {
    let cancelled = false;
    fetchDiscounts(machineId).then(data => {
      if (!cancelled) {
        setDiscounts(data);
        setStep('discounts');
      }
    });
    return () => { cancelled = true; };
  }, [machineId]);

  // ---- HANDLERS ----

  const handleClaimDiscount = useCallback((discount) => {
    setSelectedDiscount(discount);
    if (customer) {
      // Already has account, skip to confirmed
      setStep('confirmed');
    } else {
      setStep('account');
    }
  }, [customer]);

  const handleSaveAccount = useCallback(async () => {
    if (!accountName.trim() || !accountContact.trim() || !accountZelle.trim()) return;
    setSaving(true);
    try {
      const result = await saveCustomerAccount({
        name: accountName.trim(),
        contact: accountContact.trim(),
        zelle: accountZelle.trim(),
      });
      const customerData = {
        id: result.customerId,
        name: accountName.trim(),
        contact: accountContact.trim(),
        zelle: accountZelle.trim(),
      };
      saveCustomer(customerData);
      setCustomer(customerData);
      setStep('confirmed');
    } finally {
      setSaving(false);
    }
  }, [accountName, accountContact, accountZelle]);

  const handleIBoughtIt = useCallback(() => {
    if (selectedDiscount) {
      setProofAmount(
        selectedDiscount.expectedPrice
          ? selectedDiscount.expectedPrice.toFixed(2)
          : ''
      );
    }
    setStep('proof');
  }, [selectedDiscount]);

  const handleSubmitProof = useCallback(async () => {
    setSaving(true);
    try {
      await submitProof(null, {
        amount: parseFloat(proofAmount),
        hasReceipt: !noReceipt,
        file: proofFile,
      });
      setStep('done');
    } finally {
      setSaving(false);
    }
  }, [proofAmount, noReceipt, proofFile]);

  const handleViewHistory = useCallback(async () => {
    setSaving(true);
    try {
      const data = await fetchHistory(customer?.id);
      setHistory(data);
      setStep('history');
    } finally {
      setSaving(false);
    }
  }, [customer]);

  const handleReset = useCallback(() => {
    setSelectedDiscount(null);
    setProofAmount('');
    setProofFile(null);
    setNoReceipt(false);
    setStep('discounts');
  }, []);

  const handleCancelClaim = useCallback(() => {
    setSelectedDiscount(null);
    setStep('discounts');
  }, []);

  // ---- RENDERS ----

  // Loading
  if (step === 'loading') {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={spinnerStyle} />
          <p style={{ color: theme.textSecondary, margin: 0 }}>Loading discounts...</p>
        </div>
      </div>
    );
  }

  // Step 1: Available Discounts
  if (step === 'discounts') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Discounts Available at This Machine</h2>
          <p style={subtextStyle}>Claim a discount, buy the product, and get cash back.</p>
        </div>

        {discounts.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No discounts available
            </p>
            <p style={{ color: theme.textSecondary, margin: 0, lineHeight: '1.5' }}>
              No discounts available at this machine right now. Check back next visit!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {discounts.map(discount => (
              <div key={discount.id} style={cardStyle}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: theme.success + '20',
                    color: theme.success,
                  }}>
                    {discount.description}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '600' }}>
                  {discount.isAnyProduct ? 'Any Product' : discount.productName}
                </h3>
                <p style={{ color: theme.textSecondary, margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.4' }}>
                  {discount.example}
                </p>
                <button
                  onClick={() => handleClaimDiscount(discount)}
                  style={{
                    ...bigButtonStyle,
                    backgroundColor: theme.success,
                  }}
                >
                  Claim This Discount
                </button>
              </div>
            ))}
          </div>
        )}

        {customer && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={handleViewHistory} style={linkButtonStyle}>
              Check your past rebates
            </button>
          </div>
        )}

        <div style={footerStyle}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span> — Free vending management for operators
          </span>
        </div>
      </div>
    );
  }

  // Step 2: Account Setup
  if (step === 'account') {
    const canSave = accountName.trim() && accountContact.trim() && accountZelle.trim();
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Set Up Your Account</h2>
          <p style={subtextStyle}>
            Link your Zelle or phone number to receive rebates. You only need to do this once.
          </p>
        </div>

        <div style={cardStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Phone number or email</label>
            <input
              type="text"
              value={accountContact}
              onChange={e => setAccountContact(e.target.value)}
              placeholder="(555) 123-4567 or you@email.com"
              style={inputStyle}
              autoComplete="tel email"
            />
            <p style={helperTextStyle}>This is how we send you money back</p>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Zelle ID</label>
            <input
              type="text"
              value={accountZelle}
              onChange={e => setAccountZelle(e.target.value)}
              placeholder="Your Zelle phone number or email"
              style={inputStyle}
            />
            <p style={helperTextStyle}>Your Zelle phone number or email</p>
          </div>
        </div>

        <button
          onClick={handleSaveAccount}
          disabled={!canSave || saving}
          style={{
            ...bigButtonStyle,
            opacity: (!canSave || saving) ? 0.5 : 1,
            marginTop: '8px',
          }}
        >
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={handleCancelClaim} style={linkButtonStyle}>
            Cancel
          </button>
        </div>

        <div style={footerStyle}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Your information is stored securely and only used to send you rebates.
          </span>
        </div>
      </div>
    );
  }

  // Step 3: Claim Confirmed
  if (step === 'confirmed') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: theme.success + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
            color: theme.success,
            fontWeight: '700',
          }}>
            ✓
          </div>
          <h2 style={titleStyle}>Discount Claimed!</h2>
        </div>

        {selectedDiscount && (
          <div style={{ ...cardStyle, textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              ...styles.badge,
              backgroundColor: theme.success + '20',
              color: theme.success,
              marginBottom: '8px',
              display: 'inline-block',
            }}>
              {selectedDiscount.description}
            </span>
            <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px' }}>
              {selectedDiscount.isAnyProduct ? 'Any Product' : selectedDiscount.productName}
            </h3>
            <p style={{ color: theme.textSecondary, margin: 0, fontSize: '14px' }}>
              {selectedDiscount.example}
            </p>
          </div>
        )}

        <div style={{ ...cardStyle, padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: theme.textSecondary }}>
            How it works
          </h4>
          {[
            'Purchase the product from this machine at full price',
            'Come back here and tap "I Bought It" to submit your proof',
            'We\'ll send your rebate within 24 hours',
          ].map((text, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: i < 2 ? '14px' : 0,
            }}>
              <div style={{
                minWidth: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: theme.primary + '20',
                color: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: theme.text, paddingTop: '3px' }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleIBoughtIt}
          style={{
            ...bigButtonStyle,
            backgroundColor: theme.success,
            marginTop: '20px',
          }}
        >
          I Bought It
        </button>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button onClick={handleCancelClaim} style={linkButtonStyle}>
            Cancel
          </button>
        </div>

        <div style={footerStyle}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span> — Free vending management for operators
          </span>
        </div>
      </div>
    );
  }

  // Step 4: Submit Proof
  if (step === 'proof') {
    const rebateDisplay = selectedDiscount
      ? '$' + selectedDiscount.rebateAmount.toFixed(2)
      : '$0.00';
    const canSubmit = proofAmount && (noReceipt || proofFile);

    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Confirm Your Purchase</h2>
          <p style={subtextStyle}>
            Just a couple quick details and your rebate is on the way.
          </p>
        </div>

        <div style={cardStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>How much did you pay?</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: '16px',
                fontWeight: '600',
              }}>$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={proofAmount}
                onChange={e => setProofAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  ...inputStyle,
                  paddingLeft: '30px',
                }}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Upload receipt or photo</label>
            <label style={{
              display: 'block',
              padding: '20px',
              border: `2px dashed ${theme.border}`,
              borderRadius: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: theme.surfaceHover,
              transition: 'border-color 0.2s',
              opacity: noReceipt ? 0.4 : 1,
              pointerEvents: noReceipt ? 'none' : 'auto',
            }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={e => setProofFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
              <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
                {proofFile
                  ? proofFile.name
                  : 'Tap to take a photo or upload'
                }
              </div>
            </label>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px 0',
          }}>
            <input
              type="checkbox"
              checked={noReceipt}
              onChange={e => {
                setNoReceipt(e.target.checked);
                if (e.target.checked) setProofFile(null);
              }}
              style={{
                width: '20px',
                height: '20px',
                accentColor: theme.primary,
                cursor: 'pointer',
              }}
            />
            <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
              No receipt needed (most machines don't give receipts)
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmitProof}
          disabled={!canSubmit || saving}
          style={{
            ...bigButtonStyle,
            backgroundColor: theme.success,
            opacity: (!canSubmit || saving) ? 0.5 : 1,
            marginTop: '8px',
          }}
        >
          {saving ? 'Submitting...' : 'Submit for Rebate'}
        </button>

        <p style={{
          textAlign: 'center',
          color: theme.textSecondary,
          fontSize: '13px',
          margin: '12px 0 0 0',
          lineHeight: '1.4',
        }}>
          Your rebate of {rebateDisplay} will be sent to your Zelle within 24 hours
        </p>

        <div style={footerStyle}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span> — Free vending management for operators
          </span>
        </div>
      </div>
    );
  }

  // Step 5: Done
  if (step === 'done') {
    const rebateDisplay = selectedDiscount
      ? '$' + selectedDiscount.rebateAmount.toFixed(2)
      : '$0.00';
    const zelleMasked = customer?.zelle
      ? '****' + customer.zelle.slice(-4)
      : '****';

    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 24px', width: '100%' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: theme.success + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
            color: theme.success,
            fontWeight: '700',
          }}>
            ✓
          </div>
          <h2 style={{ ...titleStyle, fontSize: '24px', marginBottom: '12px' }}>Rebate Submitted!</h2>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.5' }}>
            We'll send {rebateDisplay} to your Zelle ending in {zelleMasked} within 24 hours.
          </p>

          <button onClick={handleViewHistory} disabled={saving} style={linkButtonStyle}>
            {saving ? 'Loading...' : 'Check your past rebates'}
          </button>

          <button
            onClick={handleReset}
            style={{
              ...bigButtonStyle,
              marginTop: '16px',
            }}
          >
            Back to Machine
          </button>

          <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <span style={{ color: theme.textMuted, fontSize: '12px' }}>
              Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span> — Free vending management for operators
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Customer History
  if (step === 'history') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Your Rebates</h2>
          <p style={subtextStyle}>Track your past discounts and payouts.</p>
        </div>

        {history.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: theme.textSecondary, margin: 0 }}>
              No rebates yet. Claim a discount to get started!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map(item => (
              <div key={item.id} style={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 0,
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '15px' }}>
                    {item.product}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted }}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontWeight: '700',
                    fontSize: '16px',
                    color: theme.success,
                  }}>
                    ${item.rebateAmount.toFixed(2)}
                  </p>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: item.status === 'Paid'
                      ? theme.success + '20'
                      : theme.warning + '20',
                    color: item.status === 'Paid'
                      ? theme.success
                      : theme.warning,
                    fontSize: '11px',
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleReset}
          style={{
            ...bigButtonStyle,
            marginTop: '24px',
          }}
        >
          Back to Discounts
        </button>

        <div style={footerStyle}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span> — Free vending management for operators
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================
// EXPORTS
// ============================================

export { DiscountCustomerFlow };

export default function DiscountCustomerPage() {
  return <DiscountCustomerFlow machineId="demo" />;
}
