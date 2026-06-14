import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LeadCapture from '../components/LeadCapture';

const theme = {
  bg: '#0a0e12',
  surface: '#121821',
  border: '#27323f',
  primary: '#0c8a7e',
  primaryHover: '#0a7368',
  success: '#22c55e',
  text: '#eef2f4',
  textSecondary: '#9fb0bb',
};

const benefits = [
  { icon: '📊', text: 'Track inventory and expiration dates across every machine' },
  { icon: '🗳️', text: 'Let customers vote on what to stock with QR polls' },
  { icon: '🚚', text: 'Auto-generated restocking routes save hours per week' },
];

export default function AdLanding() {
  const [searchParams] = useSearchParams();

  // Track UTM params
  useEffect(() => {
    const utmData = {
      utm_source: searchParams.get('utm_source') || 'paid',
      utm_medium: searchParams.get('utm_medium') || 'cpc',
      utm_campaign: searchParams.get('utm_campaign') || 'get-started',
      utm_term: searchParams.get('utm_term') || '',
      utm_content: searchParams.get('utm_content') || '',
    };
    localStorage.setItem('utm_params', JSON.stringify(utmData));
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>IDDI — Free Vending Machine Management</title>
        <meta name="description" content="Stop guessing. Stock what sells. Free vending machine management — inventory, QR polls, route planning, analytics." />
        <meta property="og:title" content="IDDI — Free Vending Machine Management" />
        <meta property="og:description" content="Free inventory tracking, customer polling, route optimization, and analytics for vending operators." />
      </Helmet>

      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
        {/* Hero — no nav bar */}
        <section style={{ padding: '80px 20px 48px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Stop Guessing.<br />Stock What Sells.
          </h1>

          <p style={{ fontSize: 18, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
            Free vending machine management — inventory, QR polls, route planning, analytics.
          </p>

          <Link
            to="/vendor/login"
            style={{
              display: 'inline-block',
              padding: '18px 44px',
              backgroundColor: theme.primary,
              color: '#fff',
              borderRadius: 10,
              fontSize: 20,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.primaryHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.primary}
          >
            Create Free Account
          </Link>

          <p style={{ color: theme.success, fontSize: 14, fontWeight: 600, marginTop: 14 }}>
            Free forever. No credit card.
          </p>
        </section>

        {/* Benefits */}
        <section style={{ padding: '32px 20px 48px', maxWidth: 520, margin: '0 auto' }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              marginBottom: 20,
              padding: '16px 20px',
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{b.icon}</span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: theme.text }}>{b.text}</p>
            </div>
          ))}
        </section>

        {/* Social proof */}
        <section style={{ padding: '0 20px 48px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: theme.textSecondary, fontWeight: 600 }}>
            Join <span style={{ color: theme.success }}>500+ machines</span> already managed on IDDI
          </p>
        </section>

        {/* Lead capture */}
        <section style={{ padding: '0 20px 60px', maxWidth: 480, margin: '0 auto' }}>
          <LeadCapture />
        </section>

        {/* Bottom CTA */}
        <section style={{
          padding: '48px 20px',
          textAlign: 'center',
          borderTop: `1px solid ${theme.border}`,
        }}>
          <Link
            to="/vendor/login"
            style={{
              display: 'inline-block',
              padding: '16px 36px',
              backgroundColor: theme.primary,
              color: '#fff',
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Create Free Account
          </Link>
          <p style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12 }}>
            Free forever. No credit card.
          </p>
        </section>
      </div>
    </>
  );
}
