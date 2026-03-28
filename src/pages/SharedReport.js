import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../services/api';
import LeadCapture from '../components/LeadCapture';

const theme = {
  bg: '#0d0d1a', surface: '#1a1a2e', border: '#2a2a4a',
  primary: '#7c6df0', success: '#34d399', text: '#f0f0f5',
  textSecondary: '#9d9db5', textMuted: '#6b6b85',
};

function SharedReport() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    publicAPI.getSharedReport(token).then(res => {
      setReport(res.data?.data?.report || res.data?.data);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.message || 'Report not found or expired');
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.textSecondary }}>Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '12px' }}>Report Unavailable</h2>
          <p style={{ color: theme.textSecondary, marginBottom: '24px' }}>{error || 'This report has expired or does not exist.'}</p>
          <Link to="/" style={{ color: theme.primary }}>Learn about IDDI</Link>
        </div>
      </div>
    );
  }

  const data = report.data || report;

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>Vending Report — Powered by IDDI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <nav style={{
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
        }}>
          Get IDDI Free
        </Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Vending Machine Report</h1>
        <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '32px' }}>
          Generated with IDDI — Free Vending Management
        </p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Machines', value: data.machineCount || '—' },
            { label: 'Total Products', value: data.totalProducts || '—' },
            { label: 'Customer Votes', value: data.totalVotes || '—' },
            { label: 'Engagement Rate', value: data.engagementRate ? `${data.engagementRate}%` : '—' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: '8px', padding: '20px', textAlign: 'center',
            }}>
              <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Top products */}
        {data.topProducts && data.topProducts.length > 0 && (
          <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>Top Performing Products</h2>
            {data.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.topProducts.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                <span>{i + 1}. {p.name}</span>
                <span style={{ color: theme.success, fontWeight: '600' }}>{p.score || p.votes} votes</span>
              </div>
            ))}
          </div>
        )}

        {/* Lead Capture */}
        <div style={{ marginTop: '40px' }}>
          <LeadCapture
            headline="Get Reports Like This for Your Machines"
            description="IDDI is 100% free for vending operators. Track inventory, poll customers, and optimize routes."
            leadMagnet="Vending Management Demo"
            source="shared-report"
          />
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '24px', padding: '28px', textAlign: 'center',
          backgroundColor: theme.primary + '10', border: `1px solid ${theme.primary}30`, borderRadius: '12px',
        }}>
          <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '16px' }}>Ready to start?</p>
          <p style={{ margin: '0 0 16px', color: theme.textSecondary, fontSize: '14px' }}>Set up your first machine in under 2 minutes.</p>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '12px 28px', borderRadius: '6px', fontWeight: '600', display: 'inline-block',
          }}>
            Start Free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SharedReport;
