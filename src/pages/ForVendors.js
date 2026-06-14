import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '../shared/theme';
import LeadCapture from '../components/LeadCapture';
import ExitIntentPopup from '../components/ExitIntentPopup';

const theme = {
  bg: '#0a0e12', surface: '#121821', border: '#27323f',
  primary: '#0c8a7e', success: '#22c55e', text: '#eef2f4',
  textSecondary: '#9fb0bb', textMuted: '#677884',
};

const featureIcons = ['📊', '🗳️', '🚚', '📈', '🏆', '📱'];

function ForVendors() {
  const [searchParams] = useSearchParams();
  const fromQR = searchParams.get('utm_source') === 'qr';
  const isMobile = useIsMobile();

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>IDDI for Vending Operators - Free Management Platform</title>
        <meta name="description" content="IDDI gives vending machine operators free inventory tracking, customer polling, route optimization, and analytics. Join 500+ machines already managed on IDDI." />
        <link rel="canonical" href="https://iddisolutions.net/for-vendors" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="IDDI for Vending Operators - Free Management Platform" />
        <meta property="og:description" content="Free inventory tracking, customer polling, route optimization, and analytics for vending machine operators." />
        <meta property="og:url" content="https://iddisolutions.net/for-vendors" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="IDDI for Vending Operators" />
        <meta name="twitter:description" content="Free vending machine management — inventory, QR polls, route planning, analytics." />
      </Helmet>

      {/* Nav — matches HomePage pattern */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 14, 18, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', alignItems: 'center' }}>
          {!isMobile && (
            <Link to="/vending-machine-profit-calculator" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
              Profit Calculator
            </Link>
          )}
          {!isMobile && (
            <Link to="/blog" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
              Blog
            </Link>
          )}
          <Link to="/vendor/login" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
            Sign In
          </Link>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
          }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '48px 20px 40px' : '80px 24px 60px', textAlign: 'center' }}>
        {fromQR && (
          <div style={{
            backgroundColor: theme.primary + '15', border: `1px solid ${theme.primary}30`,
            borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px' }}>
              You just used <strong style={{ color: theme.primary }}>IDDI</strong> as a customer.
              Imagine having this for <em>your</em> machines.
            </p>
          </div>
        )}

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800', marginBottom: '16px', lineHeight: 1.1 }}>
          Manage Your Vending Machines<br />
          <span style={{ color: theme.primary }}>For Free. Forever.</span>
        </h1>
        <p style={{
          fontSize: isMobile ? '15px' : '18px', color: theme.textSecondary,
          lineHeight: 1.7, marginBottom: '40px', maxWidth: '640px', margin: '0 auto 40px',
        }}>
          IDDI replaces spreadsheets, gut feelings, and expensive enterprise software.
          Track every machine, every product, every customer preference — from your phone.
        </p>

        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '16px 40px', borderRadius: '8px', fontWeight: '700', fontSize: '18px',
          display: 'inline-block',
        }}>
          Create Free Account
        </Link>
      </section>

      {/* Feature Cards */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 24px 60px' }}>
        <h2 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>What You Get</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
          {[
            { title: 'Machine Dashboard', desc: 'Add all your machines with locations. See performance at a glance. Generate QR codes instantly.' },
            { title: 'Customer Polling via QR', desc: 'Stick a QR code on your machine. Customers swipe to vote on products. You stock what sells — not what you think sells.' },
            { title: 'Smart Route Planning', desc: 'IDDI generates restocking plans based on machine performance. Know what to bring, what to move, and which machines need attention.' },
            { title: 'Product Rankings', desc: 'Our Top 50 algorithm ranks every product across all your machines. See exactly what\'s crushing it and what\'s dead weight.' },
            { title: 'Inventory Tracking', desc: 'Track stock levels, expiration dates, purchase history, and reorder points. No more surprise stockouts.' },
            { title: 'Performance Analytics', desc: 'Engagement rates, customer votes, scan data, and trends — all in real-time charts.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '28px', backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderLeft: `3px solid ${i % 2 === 0 ? theme.primary : theme.success}`,
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '28px' }}>{featureIcons[i]}</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{item.title}</h3>
              </div>
              <p style={{ margin: 0, color: theme.textSecondary, lineHeight: 1.6, fontSize: '14px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lead Capture */}
      <section style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '48px 20px' : '60px 24px', borderTop: `1px solid ${theme.border}` }}>
        <LeadCapture
          headline="Free Route Optimization Checklist"
          description="Plan smarter restocking trips. Our checklist helps you cut drive time and restock the right machines first."
          leadMagnet="Route Optimization Checklist"
          source="for-vendors"
        />
      </section>

      {/* Bottom CTA */}
      <section style={{
        borderTop: `1px solid ${theme.border}`,
        padding: isMobile ? '60px 20px 64px' : '80px 24px 80px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '16px' }}>Start in 2 Minutes</h2>
        <p style={{ color: theme.textSecondary, marginBottom: '32px', fontSize: isMobile ? '15px' : '18px', maxWidth: '500px', margin: '0 auto 32px' }}>
          No credit card. No setup fee. No catch.
        </p>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '18px 48px', borderRadius: '8px', fontWeight: '700', fontSize: '18px',
          display: 'inline-block',
        }}>
          Get Started Free
        </Link>
      </section>

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        headline="Wait — Free Checklist Inside"
        description="Our Route Optimization Checklist helps you restock smarter and save hours every week."
        leadMagnet="Route Optimization Checklist"
        source="for-vendors-exit"
      />

      {/* Footer — matches HomePage pattern */}
      <footer style={{
        borderTop: `1px solid ${theme.border}`, padding: '40px 24px',
        maxWidth: '800px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px',
      }}>
        <div>
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '3px' }}>IDDI</span>
          <p style={{ color: theme.textMuted, fontSize: '13px', marginTop: '8px' }}>
            Free vending machine management for everyone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/vending-machine-profit-calculator" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Profit Calculator</Link>
              <Link to="/vendor/login" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Sign In</Link>
            </div>
          </div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/blog" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Blog</Link>
              <Link to="/how-to-start-a-vending-machine-business" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Startup Guide</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ForVendors;
