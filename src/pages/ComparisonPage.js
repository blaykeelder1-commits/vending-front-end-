import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const theme = {
  bg: '#0a0e12', surface: '#121821', border: '#27323f',
  primary: '#0c8a7e', success: '#22c55e', danger: '#ef4444',
  text: '#eef2f4', textSecondary: '#9fb0bb', textMuted: '#677884',
};

const comparisons = {
  cantaloupe: {
    name: 'Cantaloupe',
    title: 'IDDI vs Cantaloupe (2026): Why Small Operators Are Switching',
    meta: 'Compare IDDI and Cantaloupe for vending machine management. See features, pricing, and why operators with 1-50 machines choose IDDI.',
    tagline: 'Cantaloupe is built for enterprise chains. IDDI is built for you.',
    features: [
      { feature: 'Price', them: '$50-200/mo per machine', us: 'Free forever', winner: 'iddi' },
      { feature: 'Minimum machines', them: 'Enterprise contracts', us: 'No minimum — works with 1 machine', winner: 'iddi' },
      { feature: 'Cashless payments', them: 'Yes (hardware required)', us: 'Not yet (coming soon)', winner: 'them' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR-based swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'Inventory tracking', them: 'Yes (with hardware)', us: 'Yes (mobile-first)', winner: 'tie' },
      { feature: 'Route optimization', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Analytics', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Setup time', them: 'Days to weeks', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract required', them: 'Yes (multi-year)', us: 'No contract ever', winner: 'iddi' },
    ],
    paragraphs: [
      'Cantaloupe (formerly USA Technologies) is the market leader in vending machine telemetry and cashless payments. They process over $1B in vending transactions annually and power some of the largest vending operations in the country.',
      'But here\'s the thing: if you\'re running 1-50 machines, Cantaloupe wasn\'t built for you. Their pricing assumes hundreds of machines. Their contracts lock you in for years. Their hardware requires professional installation.',
      'IDDI takes a different approach. Instead of expensive hardware, IDDI uses QR codes and your existing smartphone. Instead of enterprise contracts, IDDI is free — forever. Instead of guessing what to stock, IDDI lets your customers tell you through swipe-based polls.',
      'If you need cashless payment processing, Cantaloupe still wins there. But for everything else — inventory tracking, route planning, customer engagement, product analytics — IDDI gives you 90% of the functionality at 0% of the cost.',
    ],
  },
  vendsoft: {
    name: 'VendSoft',
    title: 'IDDI vs VendSoft (2026): Feature Comparison for Vending Operators',
    meta: 'Compare IDDI and VendSoft for vending machine management. Free vs paid, features, customer engagement, and which is right for your operation.',
    tagline: 'VendSoft charges monthly. IDDI is free. Both manage machines. Only one talks to your customers.',
    features: [
      { feature: 'Price', them: '$20-50/mo', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR codes', them: 'No', us: 'Auto-generated per machine', winner: 'iddi' },
      { feature: 'Inventory tracking', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Route planning', them: 'Yes (manual)', us: 'Yes (auto-generated plans)', winner: 'iddi' },
      { feature: 'Product rankings', them: 'Basic reports', us: 'Top 50 algorithm across all machines', winner: 'iddi' },
      { feature: 'Desktop app', them: 'Yes (Windows)', us: 'Web app (works everywhere)', winner: 'tie' },
      { feature: 'Mobile app', them: 'Limited', us: 'Full mobile-first experience', winner: 'iddi' },
      { feature: 'Customer suggestions', them: 'No', us: 'Yes — customers can suggest products', winner: 'iddi' },
      { feature: 'Expiration tracking', them: 'Yes', us: 'Yes', winner: 'tie' },
    ],
    paragraphs: [
      'VendSoft has been around since the early days of vending management software. It\'s a reliable desktop application that handles the basics: tracking machines, products, and inventory.',
      'The main limitation? VendSoft is a one-way tool. You manage your machines, but your customers have no voice. There\'s no way for the people actually buying from your machines to tell you what they want.',
      'IDDI closes this gap with QR-based customer polling. Every machine gets a QR code. Customers scan, swipe through products, and vote. You get real data on what to stock — not guesses.',
      'VendSoft also requires a monthly subscription ($20-50/mo), while IDDI is completely free. For operators who want modern, mobile-first management with customer engagement built in, IDDI is the clear choice.',
    ],
  },
  'haha-vending': {
    name: 'Haha Vending',
    title: 'IDDI vs Haha Vending (2026): Free Vending Management with Customer Engagement',
    meta: 'Compare IDDI and Haha Vending for vending machine management. See pricing, features, customer polling, and which app is best for small operators.',
    tagline: 'Haha Vending manages your routes. IDDI manages your routes and listens to your customers — for free.',
    features: [
      { feature: 'Price', them: '$30-60/mo', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'Inventory tracking', them: 'Yes', us: 'Yes (mobile-first)', winner: 'tie' },
      { feature: 'Route planning', them: 'Yes', us: 'Yes (auto-generated)', winner: 'tie' },
      { feature: 'Reporting', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Setup time', them: '15-30 minutes', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract', them: 'Monthly subscription', us: 'No contract ever', winner: 'iddi' },
      { feature: 'Product rankings', them: 'No', us: 'Top 50 algorithm', winner: 'iddi' },
    ],
    paragraphs: [
      'Haha Vending is a mobile vending management app that helps operators handle route planning, inventory, and basic reporting. It targets small to mid-size operators with a monthly subscription ranging from $30 to $60 per month.',
      'Where Haha Vending falls short is customer engagement. There is no way for the people buying from your machines to provide feedback, vote on products, or interact with your brand. You are left guessing what to stock based on sales data alone.',
      'IDDI fills that gap entirely. With QR-based swipe polls on every machine, your customers tell you exactly what they want. Combine that with auto-generated route plans, a Top 50 product ranking algorithm, and mobile-first inventory tracking — and you get a more complete toolkit.',
      'The biggest difference? IDDI is free forever with no contract. Haha Vending charges $30-60/mo for features that overlap heavily with what IDDI offers at zero cost. For operators looking to maximize profit per machine, IDDI delivers more insight for less money.',
    ],
  },
  '365-retail-markets': {
    name: '365 Retail Markets',
    title: 'IDDI vs 365 Retail Markets (2026): Enterprise Platform vs Free Operator Tool',
    meta: 'Compare IDDI and 365 Retail Markets for vending and micro market management. Enterprise pricing vs free, features, and which fits your operation size.',
    tagline: '365 Retail Markets powers enterprise micro markets. IDDI empowers the solo operator — for free.',
    features: [
      { feature: 'Price', them: '$100+/mo per location', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'Self-checkout kiosks', them: 'Yes (hardware required)', us: 'No', winner: 'them' },
      { feature: 'Planogram management', them: 'Yes', us: 'No', winner: 'them' },
      { feature: 'Inventory tracking', them: 'Yes (enterprise-grade)', us: 'Yes (mobile-first)', winner: 'them' },
      { feature: 'Real-time sales data', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Setup time', them: 'Weeks (hardware install)', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract', them: 'Multi-year enterprise contract', us: 'No contract ever', winner: 'iddi' },
      { feature: 'Product rankings', them: 'Sales-based reports', us: 'Top 50 algorithm', winner: 'iddi' },
    ],
    paragraphs: [
      '365 Retail Markets is a leading enterprise platform for micro markets, smart coolers, and self-checkout vending. They serve large-scale operations with sophisticated kiosk hardware, planogram management, and real-time sales dashboards. Their technology is impressive — and priced accordingly at $100 or more per location per month.',
      'For operators running 1-50 traditional vending machines, 365 Retail Markets is overkill. The enterprise contracts, hardware installation timelines, and per-location costs simply do not make sense for a small route. You end up paying for features designed for corporate breakrooms and campus micro markets.',
      'IDDI is built for the operator that 365 Retail Markets overlooks. You get inventory tracking, route planning, product analytics, and something 365 does not offer at all: direct customer engagement through QR-based polls. Your customers scan, swipe, and tell you what they actually want to buy.',
      'If you operate micro markets or need self-checkout kiosks, 365 Retail Markets is the right choice. But if you run traditional vending machines and want to maximize profit without enterprise overhead, IDDI gives you powerful tools for free — no hardware, no contract, no monthly bill.',
    ],
  },
  parlevel: {
    name: 'Parlevel Systems',
    title: 'IDDI vs Parlevel Systems (2026): Telemetry Platform vs Free Management Tool',
    meta: 'Compare IDDI and Parlevel Systems for vending management. Hardware-based telemetry vs free mobile-first tools, pricing, and feature breakdown.',
    tagline: 'Parlevel sells hardware and telemetry. IDDI gives you smart management and customer insight — no hardware needed.',
    features: [
      { feature: 'Price', them: '$15-30/mo per machine', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'VMS telemetry', them: 'Yes (hardware required)', us: 'No', winner: 'them' },
      { feature: 'Pre-kitting', them: 'Yes', us: 'No', winner: 'them' },
      { feature: 'Inventory tracking', them: 'Yes (sensor-based)', us: 'Yes (mobile-first)', winner: 'them' },
      { feature: 'Route planning', them: 'Yes', us: 'Yes (auto-generated)', winner: 'tie' },
      { feature: 'Setup time', them: 'Hardware install required', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract', them: 'Monthly per machine', us: 'No contract ever', winner: 'iddi' },
      { feature: 'Product rankings', them: 'Sales reports', us: 'Top 50 algorithm', winner: 'iddi' },
    ],
    paragraphs: [
      'Parlevel Systems is a vending management platform built around hardware telemetry. Their VMS sensors connect directly to your machines to track real-time inventory levels, enable pre-kitting for route drivers, and provide detailed sales analytics. It is a capable system — if you are willing to invest in the hardware.',
      'The cost adds up quickly. At $15-30 per machine per month plus the upfront hardware expense, a 30-machine route could cost $450-900 monthly just for the management platform. For many small operators, that eats directly into the margins IDDI is designed to protect.',
      'IDDI takes a software-only approach. No sensors to install, no hardware to buy, no per-machine fees. You get mobile-first inventory tracking, auto-generated route plans, and a Top 50 product ranking algorithm. More importantly, you get something Parlevel does not offer: direct customer feedback through QR polls on every machine.',
      'Parlevel wins on sensor-based telemetry and pre-kitting — those features genuinely require hardware. But for operators who want to understand their customers, optimize their product mix, and manage routes without monthly fees, IDDI is the smarter starting point. You can always add telemetry hardware later while using IDDI for the engagement and analytics layer.',
    ],
  },
  gimme: {
    name: 'Gimme Vending',
    title: 'IDDI vs Gimme Vending (2026): Location Marketplace vs Full Management Platform',
    meta: 'Compare IDDI and Gimme Vending for vending operators. Location placement vs full inventory management, customer engagement, and pricing breakdown.',
    tagline: 'Gimme helps you find locations. IDDI helps you make those locations profitable.',
    features: [
      { feature: 'Price', them: 'Varies (placement fees)', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'Location finding', them: 'Yes (marketplace)', us: 'No', winner: 'them' },
      { feature: 'Inventory tracking', them: 'Limited', us: 'Yes (mobile-first)', winner: 'iddi' },
      { feature: 'Route planning', them: 'No', us: 'Yes (auto-generated)', winner: 'iddi' },
      { feature: 'Setup time', them: 'Varies', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract', them: 'Per-placement basis', us: 'No contract ever', winner: 'iddi' },
      { feature: 'Product rankings', them: 'No', us: 'Top 50 algorithm', winner: 'iddi' },
    ],
    paragraphs: [
      'Gimme Vending operates as a vending machine marketplace and locator platform. Their primary value is connecting vending operators with locations that need machines — essentially a matchmaking service for vending placements. If you are looking to expand your route, Gimme can help you find new spots.',
      'However, Gimme is not a full management platform. Once you have placed your machines, you are largely on your own when it comes to tracking inventory, optimizing product selection, planning routes, and engaging with your customers. The tool solves one piece of the puzzle.',
      'IDDI solves the rest. With mobile-first inventory tracking, auto-generated route plans, a Top 50 product ranking algorithm, and QR-based customer polls, IDDI gives you everything you need to make each location as profitable as possible. You can use Gimme to find great locations and IDDI to maximize the revenue once machines are placed.',
      'The two tools complement each other well. Gimme gets you in the door; IDDI keeps your customers happy and your margins healthy. And since IDDI is free forever with no contract, there is zero risk in adding it to your workflow alongside any location service.',
    ],
  },
  vagabond: {
    name: 'Vagabond',
    title: 'IDDI vs Vagabond (2026): Route Optimization vs Complete Vending Management',
    meta: 'Compare IDDI and Vagabond for vending route management. Route optimization vs full management with customer engagement, pricing, and features compared.',
    tagline: 'Vagabond optimizes your drive. IDDI optimizes your entire operation — routes, products, and customer loyalty.',
    features: [
      { feature: 'Price', them: 'Monthly subscription', us: 'Free forever', winner: 'iddi' },
      { feature: 'Customer polling', them: 'No', us: 'Yes — QR swipe polls', winner: 'iddi' },
      { feature: 'QR engagement', them: 'No', us: 'Yes — every machine gets a QR code', winner: 'iddi' },
      { feature: 'Route optimization', them: 'Yes (advanced)', us: 'Yes (auto-generated)', winner: 'them' },
      { feature: 'Delivery tracking', them: 'Yes', us: 'Yes', winner: 'tie' },
      { feature: 'Inventory tracking', them: 'Limited', us: 'Yes (mobile-first)', winner: 'iddi' },
      { feature: 'Setup time', them: '10-20 minutes', us: '2 minutes', winner: 'iddi' },
      { feature: 'Contract', them: 'Monthly subscription', us: 'No contract ever', winner: 'iddi' },
      { feature: 'Product rankings', them: 'No', us: 'Top 50 algorithm', winner: 'iddi' },
    ],
    paragraphs: [
      'Vagabond is a route management and delivery optimization tool built for vending and distribution operators. Its core strength is planning efficient routes — minimizing drive time, sequencing stops intelligently, and tracking deliveries in real time. If route efficiency is your biggest pain point, Vagabond delivers.',
      'Where Vagabond falls short is everything that happens after you arrive at the machine. Inventory intelligence is limited, there are no customer-facing features, and product selection decisions are left entirely to your gut. You know the fastest way to get to each machine, but you may not be stocking the right products when you arrive.',
      'IDDI approaches the problem from the other direction. Yes, it includes auto-generated route plans, but its real power is in product intelligence and customer engagement. QR-based polls let your customers vote on what they want. The Top 50 algorithm ranks products across your entire operation. Mobile-first inventory tracking ensures you know exactly what each machine needs before you leave the warehouse.',
      'For operators who want the best of both worlds, IDDI and Vagabond can work side by side. Use Vagabond for advanced route optimization and IDDI for product intelligence and customer engagement. Since IDDI is free with no contract, adding it to your existing workflow costs nothing and gives you a direct line to your customers.',
    ],
  },
};

function ComparisonPage() {
  const { competitor } = useParams();
  const data = comparisons[competitor];

  if (!data) {
    return (
      <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Comparison Not Found</h1>
          <Link to="/" style={{ color: theme.primary }}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>{data.title} | IDDI</title>
        <meta name="description" content={data.meta} />
        <link rel="canonical" href={`https://iddisolutions.net/vs/${competitor}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${data.title} | IDDI`} />
        <meta property="og:description" content={data.meta} />
        <meta property="og:url" content={`https://iddisolutions.net/vs/${competitor}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={data.meta} />
      </Helmet>

      <nav style={{
        background: 'rgba(10, 14, 18, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
        }}>
          Try IDDI Free
        </Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', marginBottom: '12px', lineHeight: 1.2 }}>
          {data.title}
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: '18px', marginBottom: '40px', lineHeight: 1.5 }}>
          {data.tagline}
        </p>

        {/* Feature comparison table */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 20px', borderBottom: `2px solid ${theme.border}`, fontSize: '14px', fontWeight: '600' }}>
            <div>Feature</div>
            <div style={{ textAlign: 'center' }}>{data.name}</div>
            <div style={{ textAlign: 'center', color: theme.primary }}>IDDI</div>
          </div>
          {data.features.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '14px 20px',
              borderBottom: i < data.features.length - 1 ? `1px solid ${theme.border}` : 'none',
              fontSize: '14px',
            }}>
              <div style={{ fontWeight: '500' }}>{row.feature}</div>
              <div style={{ textAlign: 'center', color: row.winner === 'them' ? theme.success : theme.textMuted }}>
                {row.them}
              </div>
              <div style={{ textAlign: 'center', color: row.winner === 'iddi' ? theme.success : (row.winner === 'tie' ? theme.text : theme.textMuted) }}>
                {row.us}
              </div>
            </div>
          ))}
        </div>

        {/* Analysis */}
        {data.paragraphs.map((p, i) => (
          <p key={i} style={{ color: theme.textSecondary, lineHeight: 1.8, fontSize: '16px', marginBottom: '16px' }}>{p}</p>
        ))}

        {/* CTA */}
        <div style={{
          marginTop: '48px', padding: '32px', backgroundColor: theme.primary + '10',
          border: `1px solid ${theme.primary}30`, borderRadius: '12px', textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '24px' }}>Ready to try IDDI?</h3>
          <p style={{ color: theme.textSecondary, margin: '0 0 20px' }}>
            Free forever. Set up in 2 minutes. No contract.
          </p>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '14px 36px', borderRadius: '8px', fontWeight: '600', fontSize: '16px',
            display: 'inline-block',
          }}>
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ComparisonPage;
