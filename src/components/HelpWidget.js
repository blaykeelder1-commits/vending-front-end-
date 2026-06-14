import React, { useState } from 'react';
import { vendorAPI } from '../services/api';
import { theme, useIsMobile } from '../shared/theme';

const FAQ_ITEMS = [
  {
    q: 'How do I add a machine?',
    a: 'From your dashboard, click "Add Machine." Enter the name and location, then download the QR code to stick on your machine.',
  },
  {
    q: 'How do QR codes work?',
    a: 'Each machine gets a unique QR code. When a customer scans it, they can vote on products they want stocked. You see the results in your dashboard.',
  },
  {
    q: 'What does performance marking do?',
    a: 'You mark products as "performing" or "not performing" based on your observations. IDDI tracks these over time to identify trends and suggest swaps.',
  },
  {
    q: 'How does the route plan work?',
    a: 'The route plan shows which machines need attention, what products to bring, and what to swap out — all based on your inventory and performance data.',
  },
  {
    q: 'How do I track expiration dates?',
    a: 'When adding products to a machine, set the expiration date. IDDI alerts you before products expire so you can move or discount them.',
  },
  {
    q: 'Can I manage multiple machines?',
    a: 'The free plan includes 1 machine. Upgrade to Growth ($19/mo) for up to 10, Pro ($49/mo) for 30, or Business ($99/mo) for 100.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Go to Settings > Subscription, or visit the Pricing page. Choose a plan and complete checkout. Your machine limit updates immediately.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Go to Settings > Subscription > Cancel. No contracts, no cancellation fees. Your account moves to the free plan.',
  },
];

function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('faq'); // 'faq' | 'contact' | 'feature'
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const filteredFAQ = searchQuery
    ? FAQ_ITEMS.filter(f =>
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_ITEMS;

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await vendorAPI.createSupportTicket({ subject, message });
      setSuccess('Ticket submitted! We\'ll get back to you soon.');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeature = async () => {
    if (!featureTitle.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await vendorAPI.createFeatureRequest({ title: featureTitle, description: featureDesc });
      setSuccess('Feature request submitted! Thanks for the feedback.');
      setFeatureTitle('');
      setFeatureDesc('');
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const panelWidth = isMobile ? '100%' : '380px';
  const panelHeight = isMobile ? '85vh' : '520px';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setSuccess(''); setError(''); }}
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 24,
          right: isMobile ? 16 : 24,
          width: 48, height: 48,
          borderRadius: '50%',
          backgroundColor: theme.primary,
          color: '#fff',
          border: 'none',
          fontSize: 22,
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(15, 148, 136, 0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? '+' : '?'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? 0 : 80,
          right: isMobile ? 0 : 24,
          width: panelWidth,
          height: panelHeight,
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: isMobile ? '16px 16px 0 0' : '16px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <h3 style={{ color: theme.text, margin: 0, fontSize: 16, fontWeight: 700 }}>
              Help Center
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {[
                { key: 'faq', label: 'FAQ' },
                { key: 'contact', label: 'Contact Us' },
                { key: 'feature', label: 'Feature Request' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSuccess(''); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: tab === t.key ? 600 : 400,
                    cursor: 'pointer',
                    backgroundColor: tab === t.key ? `${theme.primary}20` : 'transparent',
                    color: tab === t.key ? theme.primary : theme.textSecondary,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            {success && (
              <div style={{
                backgroundColor: `${theme.success}15`,
                border: `1px solid ${theme.success}40`,
                borderRadius: 8, padding: '10px 14px',
                marginBottom: 16, color: theme.success, fontSize: 13,
              }}>
                {success}
              </div>
            )}

            {error && (
              <div style={{
                backgroundColor: `${theme.danger}15`,
                border: `1px solid ${theme.danger}40`,
                borderRadius: 8, padding: '10px 14px',
                marginBottom: 16, color: theme.danger, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {tab === 'faq' && (
              <>
                <input
                  type="text"
                  placeholder="Search help..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    backgroundColor: theme.bg, color: theme.text,
                    border: `1px solid ${theme.border}`, fontSize: 13,
                    marginBottom: 12, boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredFAQ.map((item, i) => (
                    <FAQAccordion key={i} question={item.q} answer={item.a} />
                  ))}
                  {filteredFAQ.length === 0 && (
                    <p style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                      No results. Try a different search or contact us.
                    </p>
                  )}
                </div>
              </>
            )}

            {tab === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      backgroundColor: theme.bg, color: theme.text,
                      border: `1px solid ${theme.border}`, fontSize: 13,
                    }}
                  >
                    <option value="">Select a topic...</option>
                    <option value="Bug report">Bug report</option>
                    <option value="How do I...">How do I...</option>
                    <option value="Billing question">Billing question</option>
                    <option value="Account issue">Account issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      backgroundColor: theme.bg, color: theme.text,
                      border: `1px solid ${theme.border}`, fontSize: 13,
                      resize: 'vertical', minHeight: 100, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitTicket}
                  disabled={submitting || !subject || !message.trim()}
                  style={{
                    padding: '11px 0', borderRadius: 8, border: 'none',
                    backgroundColor: subject && message.trim() ? theme.primary : theme.border,
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}

            {tab === 'feature' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: theme.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Have an idea for a new feature? We'd love to hear it.
                </p>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    Feature title
                  </label>
                  <input
                    type="text"
                    value={featureTitle}
                    onChange={e => setFeatureTitle(e.target.value)}
                    placeholder="e.g., Export data to CSV"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      backgroundColor: theme.bg, color: theme.text,
                      border: `1px solid ${theme.border}`, fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={featureDesc}
                    onChange={e => setFeatureDesc(e.target.value)}
                    placeholder="Tell us more about what you need..."
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      backgroundColor: theme.bg, color: theme.text,
                      border: `1px solid ${theme.border}`, fontSize: 13,
                      resize: 'vertical', minHeight: 80, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitFeature}
                  disabled={submitting || !featureTitle.trim()}
                  style={{
                    padding: '11px 0', borderRadius: 8, border: 'none',
                    backgroundColor: featureTitle.trim() ? theme.primary : theme.border,
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FAQAccordion({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${theme.border}`,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none',
          color: theme.text, padding: '12px 14px',
          fontSize: 13, fontWeight: 600, textAlign: 'left',
          cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{question}</span>
        <span style={{
          color: theme.textMuted, fontSize: 16,
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 14px 12px',
          color: theme.textSecondary, fontSize: 13, lineHeight: 1.6,
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default HelpWidget;
