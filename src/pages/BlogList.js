import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../services/api';

const theme = {
  bg: '#0d0d1a', surface: '#1a1a2e', border: '#2a2a4a',
  primary: '#7c6df0', text: '#f0f0f5', textSecondary: '#9d9db5', textMuted: '#6b6b85',
};

// Static blog posts (rendered client-side for now, will move to CMS later)
const staticPosts = [
  {
    slug: 'how-to-start-a-vending-machine-business',
    title: 'How to Start a Vending Machine Business in 2026: Complete Guide',
    meta_description: 'Everything you need to know about starting a vending machine business in 2026. Location strategy, product selection, costs, and the tools that make it work.',
    published_at: '2026-03-11',
    category: 'Getting Started',
  },
  {
    slug: 'best-products-to-sell-in-vending-machines',
    title: 'Best Products to Sell in Vending Machines by Location Type (2026)',
    meta_description: 'Data-driven product recommendations for offices, gyms, hospitals, schools, and more. Based on real customer vote data from IDDI operators.',
    published_at: '2026-03-11',
    category: 'Product Strategy',
  },
  {
    slug: 'vending-machine-commission-rates',
    title: 'Vending Machine Commission Rates: 2026 Complete Guide',
    meta_description: 'What commission rates should you pay for vending machine locations? Negotiation tips, industry averages, and alternative deal structures.',
    published_at: '2026-03-11',
    category: 'Business',
  },
  {
    slug: 'vending-machine-profit-margins-explained',
    title: 'Vending Machine Profit Margins Explained: What Nobody Tells You',
    meta_description: 'Real vending machine profit margins by product type, location, and volume. Hidden costs most guides skip — spoilage, drive time, theft, and commissions.',
    published_at: '2026-03-27',
    category: 'Business',
  },
  {
    slug: 'how-to-get-vending-machine-locations',
    title: 'How to Get Vending Machine Locations: The Cold Call Script That Works',
    meta_description: 'Proven cold call script and step-by-step strategy for landing vending machine locations. Where to look, how to pitch, and how to close the deal.',
    published_at: '2026-03-27',
    category: 'Getting Started',
  },
  {
    slug: 'vending-machine-route-optimization',
    title: 'Vending Machine Route Optimization: Stop Wasting 40% of Your Drive Time',
    meta_description: 'How vending operators waste 30-40% of drive time with poor routing. Priority-based restocking, batching strategies, and data-driven route planning.',
    published_at: '2026-03-27',
    category: 'Operations',
  },
  {
    slug: 'qr-code-strategy-vending-sales',
    title: 'The QR Code Strategy That Increased My Vending Sales 23%',
    meta_description: 'How one vending operator used QR code customer polling to increase sales 23%. Step-by-step implementation guide with before and after data.',
    published_at: '2026-03-27',
    category: 'Growth',
  },
  {
    slug: 'smart-cooler-vs-traditional-vending',
    title: 'Smart Cooler vs Traditional Vending Machine: Which Makes More Money?',
    meta_description: 'Compare smart coolers, traditional combo machines, and micro markets. Setup costs, revenue, maintenance, and which format makes the most money for operators.',
    published_at: '2026-03-27',
    category: 'Comparison',
  },
  {
    slug: 'vending-machine-expiration-tracking',
    title: 'Vending Machine Expiration Tracking: How to Stop Losing $200/Month',
    meta_description: 'Most vending operators lose $150-300/month to spoilage without realizing it. Learn expiration tracking strategies, FIFO methods, and how to eliminate waste.',
    published_at: '2026-03-27',
    category: 'Operations',
  },
  {
    slug: 'best-vending-machine-software-2026',
    title: 'Best Vending Machine Software in 2026: Honest Comparison',
    meta_description: 'Honest comparison of the best vending machine management software in 2026. IDDI, Cantaloupe, VendSoft, Parlevel, 365 Retail Markets, and Haha Vending reviewed.',
    published_at: '2026-03-27',
    category: 'Reviews',
  },
  {
    slug: 'customer-polling-vending-machines',
    title: 'How Customer Polling Changed What I Stock (Real Data)',
    meta_description: 'Real case study: how QR-based customer polling changed my vending product mix, increased revenue 27%, and revealed surprises about what customers actually want.',
    published_at: '2026-03-27',
    category: 'Growth',
  },
];

function BlogList() {
  const [dbPosts, setDbPosts] = useState([]);

  useEffect(() => {
    publicAPI.getBlogPosts().then(res => {
      setDbPosts(res.data?.data?.posts || []);
    }).catch(() => {});
  }, []);

  const allPosts = [...dbPosts, ...staticPosts.filter(sp => !dbPosts.some(dp => dp.slug === sp.slug))];

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>Vending Machine Business Blog | IDDI</title>
        <meta name="description" content="Expert guides on vending machine management, product strategy, route optimization, and growing your vending business. Free resources from IDDI." />
      </Helmet>

      <nav style={{
        background: 'rgba(13, 13, 26, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
        }}>
          Get Started Free
        </Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>Vending Machine Blog</h1>
        <p style={{ color: theme.textSecondary, fontSize: '16px', marginBottom: '40px' }}>
          Guides, strategies, and data-driven insights for vending operators.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {allPosts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={{
              backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: '10px', padding: '28px', textDecoration: 'none', color: theme.text,
              transition: 'border-color 0.2s',
            }}>
              {post.category && (
                <span style={{
                  fontSize: '12px', fontWeight: '600', color: theme.primary,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {post.category}
                </span>
              )}
              <h2 style={{ margin: '8px 0', fontSize: '20px', fontWeight: '600', lineHeight: 1.3 }}>
                {post.title}
              </h2>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px', lineHeight: 1.5 }}>
                {post.meta_description}
              </p>
              <span style={{ color: theme.textMuted, fontSize: '13px', marginTop: '12px', display: 'block' }}>
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlogList;
