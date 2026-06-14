import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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

const partners = {
  'jaime-ibanez': { name: 'Jaime Ibanez', platform: 'YouTube' },
  'the-vending-couple': { name: 'The Vending Couple', platform: 'YouTube' },
  'hustle-plug': { name: 'Hustle Plug', platform: 'TikTok' },
  'road-to-vending': { name: 'Road to Vending', platform: 'YouTube' },
  'vending-empire': { name: 'Vending Empire', platform: 'TikTok' },
  'daniel-gutierrez': { name: 'Daniel Gutierrez', platform: 'YouTube' },
};

const features = [
  { icon: '📊', title: 'Smart Inventory Tracking', desc: 'Track stock levels, expirations, and reorder points from one dashboard.' },
  { icon: '🗳️', title: 'Customer Polling', desc: 'QR swipe polls let customers vote on what to stock.' },
  { icon: '🚚', title: 'Route Optimization', desc: 'Auto-generated restocking plans — know what to bring and where.' },
  { icon: '📈', title: 'Performance Analytics', desc: 'Per-machine, per-product real-time performance data.' },
  { icon: '🏆', title: 'Top 50 Algorithm', desc: 'Identifies your best-performing products across all locations.' },
  { icon: '📱', title: 'QR Code Management', desc: 'Generate, print, and track QR codes for every machine.' },
];

export default function PartnerLanding() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const partner = useMemo(() => partners[slug] || null, [slug]);
  const partnerName = partner ? partner.name : null;
  const headline = partner
    ? `${partnerName} sent you here`
    : 'You were recommended IDDI by a fellow operator';
  const ctaText = partner
    ? `Start Free — ${partnerName}'s Recommendation`
    : 'Start Free — Recommended by Operators';

  // Store referral slug and UTM params
  useEffect(() => {
    if (slug) {
      localStorage.setItem('partner_slug', slug);
    }

    const utmData = {
      utm_source: searchParams.get('utm_source') || 'partner',
      utm_medium: searchParams.get('utm_medium') || 'influencer',
      utm_campaign: searchParams.get('utm_campaign') || slug || 'unknown',
    };
    localStorage.setItem('utm_params', JSON.stringify(utmData));
  }, [slug, searchParams]);

  return (
    <>
      <Helmet>
        <title>{partner ? `${partnerName} recommends IDDI` : 'IDDI — Recommended by Operators'} | Free Vending Management</title>
        <meta name="description" content={`${headline} — IDDI is free for vending operators. Smart inventory, QR polls, route planning, and analytics.`} />
        <meta property="og:title" content={`${partner ? partnerName + ' recommends ' : ''}IDDI — Free Vending Management`} />
        <meta property="og:description" content="Free vending machine management — inventory, QR polls, route planning, analytics." />
      </Helmet>

      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
        {/* Hero */}
        <section style={{ padding: '80px 20px 60px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          {partner && (
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 20,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.success,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 24,
            }}>
              via {partner.platform}
            </div>
          )}

          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            {headline}
          </h1>

          <p style={{ fontSize: 22, color: theme.success, fontWeight: 600, marginBottom: 12 }}>
            IDDI is free for vending operators
          </p>

          <p style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Smart inventory tracking, customer polling, route optimization, and analytics — everything you need to maximize profit per machine.
          </p>

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
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.primaryHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.primary}
          >
            {ctaText}
          </Link>

          <p style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12 }}>
            Free forever. No credit card required.
          </p>
        </section>

        {/* Features */}
        <section style={{ padding: '40px 20px 80px', maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 40 }}>
            What You Get
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {features.map(f => (
              <div key={f.title} style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: '24px 20px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
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
            {ctaText}
          </Link>
        </section>
      </div>
    </>
  );
}
