import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '../shared/theme';
import LeadCapture from '../components/LeadCapture';
import ExitIntentPopup from '../components/ExitIntentPopup';
import InteractiveDemo from '../components/InteractiveDemo';

const theme = {
  bg: '#0a0e12',
  surface: '#121821',
  surfaceHover: '#1b2430',
  border: '#27323f',
  primary: '#0c8a7e',
  primaryHover: '#0a7368',
  secondary: '#ff9f1c',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#fbbf24',
  text: '#eef2f4',
  textSecondary: '#9fb0bb',
  textMuted: '#677884',
};

const features = [
  {
    icon: '📊',
    title: 'Smart Inventory Tracking',
    desc: 'Know exactly what\'s in every machine. Track stock levels, expiration dates, and reorder points from one dashboard.',
  },
  {
    icon: '🗳️',
    title: 'Customer Polling',
    desc: 'QR-based swipe polls let customers vote on products. Stock what actually sells — not what you guess will sell.',
  },
  {
    icon: '🚚',
    title: 'Route Optimization',
    desc: 'Auto-generated restocking plans tell you what to bring, what to move, and which machines need attention first.',
  },
  {
    icon: '📈',
    title: 'Performance Analytics',
    desc: 'See which products crush it and which ones sit. Per-machine, per-product, real-time performance data.',
  },
  {
    icon: '🏆',
    title: 'Top 50 Algorithm',
    desc: 'Our ranking engine identifies your 50 best-performing products across all locations. Eliminate guesswork.',
  },
  {
    icon: '📱',
    title: 'QR Code Management',
    desc: 'Generate, print, and track QR codes for every machine. Customers scan to engage — you get data.',
  },
];

const steps = [
  { num: '1', title: 'Add Your Machines', desc: 'Enter your machine locations and generate QR codes in under 2 minutes.' },
  { num: '2', title: 'Load Your Products', desc: 'Add your product catalog and assign items to each machine\'s planogram.' },
  { num: '3', title: 'Print QR Codes', desc: 'Stick QR codes on machines. Customers scan to vote on what they want stocked.' },
  { num: '4', title: 'Optimize & Grow', desc: 'Use real customer data to stock better, reduce waste, and increase revenue per machine.' },
];

const integrations = [
  { name: 'Cantaloupe', what: 'Payment Processing', how: 'Keep Cantaloupe for payments. Run IDDI alongside it for inventory intelligence and customer polling.' },
  { name: 'Nayax', what: 'Cashless Payments', how: 'Keep Nayax for cashless payments. Use IDDI separately to optimize what you stock.' },
  { name: 'Vendera', what: 'Route Management', how: 'Plan routes in Vendera. Track spoilage and Top 50 product rankings in IDDI.' },
  { name: 'HahaVending', what: 'Management Software', how: 'Run HahaVending as your VMS. IDDI adds the customer-demand and product layer on top.' },
];

const demoProducts = [
  { name: 'Coca-Cola', price: 1.75, image: '/demo-products/coke.jpg' },
  { name: 'Pepsi', price: 1.75, image: '/demo-products/pepsi.jpg' },
  { name: 'Sprite', price: 1.75, image: '/demo-products/sprite.jpg' },
  { name: 'Dr Pepper', price: 1.75, image: '/demo-products/drpepper.jpg' },
];

function SwipeDemo({ isMobile }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swiping, setSwiping] = useState(null); // 'like' | 'dislike' | null
  const [votes, setVotes] = useState({ like: 0, dislike: 0 });
  const [finished, setFinished] = useState(false);
  const [cardEntering, setCardEntering] = useState(true);
  const touchStart = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 60;

  useEffect(() => {
    const timer = setTimeout(() => setCardEntering(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const advanceCard = useCallback((voteType) => {
    setVotes(prev => ({ ...prev, [voteType]: prev[voteType] + 1 }));
    setSwiping(null);
    setDragOffset(0);
    if (currentIndex < demoProducts.length - 1) {
      setCardEntering(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setCardEntering(false), 350);
    } else {
      setFinished(true);
    }
  }, [currentIndex]);

  const handleVote = useCallback((voteType) => {
    if (swiping) return;
    setSwiping(voteType);
    setTimeout(() => advanceCard(voteType), 300);
  }, [swiping, advanceCard]);

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e) => {
    if (swiping || finished) return;
    touchStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, [swiping, finished]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || swiping) return;
    setDragOffset(e.clientX - touchStart.current.x);
  }, [isDragging, swiping]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || swiping) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      handleVote(dragOffset > 0 ? 'like' : 'dislike');
    } else {
      setDragOffset(0);
    }
  }, [isDragging, swiping, dragOffset, handleVote]);

  // Touch for mobile
  const handleTouchStart = useCallback((e) => {
    if (swiping || finished) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true);
  }, [swiping, finished]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || swiping) return;
    setDragOffset(e.touches[0].clientX - touchStart.current.x);
  }, [isDragging, swiping]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || swiping) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      handleVote(dragOffset > 0 ? 'like' : 'dislike');
    } else {
      setDragOffset(0);
    }
  }, [isDragging, swiping, dragOffset, handleVote]);

  const handleReset = () => {
    setCurrentIndex(0);
    setDragOffset(0);
    setSwiping(null);
    setVotes({ like: 0, dislike: 0 });
    setFinished(false);
    setCardEntering(true);
    setTimeout(() => setCardEntering(false), 400);
  };

  useEffect(() => {
    if (isDragging) {
      const up = () => handleMouseUp();
      const move = (e) => handleMouseMove(e);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const product = demoProducts[currentIndex];

  if (finished) {
    return (
      <div style={{
        textAlign: 'center', padding: '32px 20px',
        backgroundColor: theme.surface, borderRadius: '16px',
        border: `1px solid ${theme.border}`,
        maxWidth: '340px', margin: '0 auto',
      }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: theme.success, marginBottom: '8px' }}>
          Done!
        </div>
        <p style={{ color: theme.textSecondary, fontSize: '15px', margin: '0 0 20px', lineHeight: '1.6' }}>
          That took about 15 seconds. Now imagine every customer at your machine doing this.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.success }}>{votes.like}</div>
            <div style={{ fontSize: '12px', color: theme.textMuted }}>Want it</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.danger }}>{votes.dislike}</div>
            <div style={{ fontSize: '12px', color: theme.textMuted }}>Pass</div>
          </div>
        </div>
        <p style={{ color: theme.textMuted, fontSize: '13px', margin: '0 0 20px' }}>
          You just told a vendor exactly what to stock. That is the power of IDDI.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '14px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '15px',
            display: 'block', textAlign: 'center',
          }}>
            Get This for Your Machines
          </Link>
          <button onClick={handleReset} style={{
            background: 'none', border: `1px solid ${theme.border}`, color: theme.textSecondary,
            padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const rotation = dragOffset * 0.08;
  const opacity = 1 - Math.abs(dragOffset) * 0.003;

  return (
    <div style={{ maxWidth: '340px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ textAlign: 'center', marginBottom: '12px', color: theme.textMuted, fontSize: '13px' }}>
        {currentIndex + 1} / {demoProducts.length}
      </div>

      {/* Card */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: theme.surface,
          border: `2px solid ${
            dragOffset > 20 ? theme.success + '80' :
            dragOffset < -20 ? theme.danger + '80' :
            theme.border
          }`,
          borderRadius: '16px',
          padding: '0',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          transform: `translateX(${swiping === 'like' ? 300 : swiping === 'dislike' ? -300 : dragOffset}px) rotate(${swiping === 'like' ? 15 : swiping === 'dislike' ? -15 : rotation}deg)`,
          opacity: swiping ? 0 : opacity,
          transition: swiping || cardEntering ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isDragging ? `0 8px 32px rgba(0,0,0,0.4)` : `0 4px 16px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Product image */}
        <div style={{
          height: '240px',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src={product.image}
            alt={product.name}
            style={{
              maxHeight: '220px',
              maxWidth: '90%',
              objectFit: 'contain',
            }}
            draggable={false}
          />

          {/* Swipe indicators */}
          {dragOffset > 20 && (
            <div style={{
              position: 'absolute', top: '16px', left: '16px',
              backgroundColor: theme.success, color: '#fff',
              padding: '6px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '16px',
            }}>
              WANT IT
            </div>
          )}
          {dragOffset < -20 && (
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              backgroundColor: theme.danger, color: '#fff',
              padding: '6px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '16px',
            }}>
              PASS
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '600' }}>{product.name}</h3>
          <p style={{ margin: 0, color: theme.success, fontWeight: '600', fontSize: '16px' }}>
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '16px 0' }}>
        <button
          onClick={() => handleVote('dislike')}
          disabled={!!swiping}
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: theme.surfaceHover, border: `2px solid ${theme.danger}40`,
            color: theme.danger, fontSize: '22px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s',
          }}
        >
          X
        </button>
        <button
          onClick={() => handleVote('like')}
          disabled={!!swiping}
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: theme.surfaceHover, border: `2px solid ${theme.success}40`,
            color: theme.success, fontSize: '22px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s',
          }}
        >
          +
        </button>
      </div>

      <p style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', margin: 0 }}>
        {isMobile ? 'Swipe or tap the buttons' : 'Drag the card or click the buttons'}
      </p>
    </div>
  );
}

function HomePage() {
  const [machineCount, setMachineCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Animate counter
    const target = 500;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setMachineCount(target);
        clearInterval(timer);
      } else {
        setMachineCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', overflowX: 'hidden' }}>
      <Helmet>
        <title>IDDI - Free Vending Machine Management Software</title>
        <meta name="description" content="Free vending machine inventory management and spoilage optimization. Track stock, run customer polls, optimize routes — works alongside Cantaloupe, Nayax, and any VMS. Used by 500+ machines." />
        <meta name="keywords" content="free vending machine software, vending management platform, vending inventory tracking, vending route optimization, vending machine analytics" />
        <link rel="canonical" href="https://iddisolutions.net/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="IDDI - Free Vending Machine Management Software" />
        <meta property="og:description" content="Track inventory, run customer polls, optimize routes — free forever. Works alongside Cantaloupe, Nayax, and any VMS." />
        <meta property="og:url" content="https://iddisolutions.net/" />
        <meta property="og:site_name" content="IDDI" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IDDI - Free Vending Machine Management Software" />
        <meta name="twitter:description" content="Track inventory, run customer polls, optimize routes — free forever for vending operators." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "IDDI",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": "Free vending machine management software. Track inventory, run customer polls via QR codes, optimize routes, and analyze product performance.",
          "url": "https://iddisolutions.net"
        })}</script>
      </Helmet>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 14, 18, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`,
        padding: isMobile ? '12px 16px' : '12px 24px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: '1100px', margin: '0 auto',
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff' }}>IDDI</span>
          </Link>

          {isMobile ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none', border: 'none', color: theme.text,
                fontSize: '24px', cursor: 'pointer', padding: '8px',
                lineHeight: 1,
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? '\u2715' : '\u2630'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/vending-machine-profit-calculator" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
                Profit Calculator
              </Link>
              <Link to="/blog" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
                Blog
              </Link>
              <Link to="/pricing" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
                Pricing
              </Link>
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
          )}
        </div>

        {/* Mobile menu dropdown */}
        {isMobile && menuOpen && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            paddingTop: '16px', paddingBottom: '8px',
            borderTop: `1px solid ${theme.border}`, marginTop: '12px',
          }}>
            <Link
              to="/vending-machine-profit-calculator"
              onClick={() => setMenuOpen(false)}
              style={{
                color: theme.textSecondary, textDecoration: 'none', fontSize: '15px',
                padding: '12px 0',
              }}
            >
              Profit Calculator
            </Link>
            <Link
              to="/blog"
              onClick={() => setMenuOpen(false)}
              style={{
                color: theme.textSecondary, textDecoration: 'none', fontSize: '15px',
                padding: '12px 0',
              }}
            >
              Blog
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMenuOpen(false)}
              style={{
                color: theme.textSecondary, textDecoration: 'none', fontSize: '15px',
                padding: '12px 0',
              }}
            >
              Pricing
            </Link>
            <Link
              to="/vendor/login"
              onClick={() => setMenuOpen(false)}
              style={{
                color: theme.textSecondary, textDecoration: 'none', fontSize: '15px',
                padding: '12px 0',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/vendor/login"
              onClick={() => setMenuOpen(false)}
              style={{
                backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
                padding: '12px 0', borderRadius: '6px', fontWeight: '600', fontSize: '15px',
                textAlign: 'center', marginTop: '8px',
              }}
            >
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{
        padding: isMobile ? '40px 16px 48px' : '80px 24px 60px',
        textAlign: 'center', maxWidth: '900px', margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
          backgroundColor: theme.success + '15', color: theme.success, fontWeight: '600',
          marginBottom: '24px', border: `1px solid ${theme.success}30`,
        }}>
          100% Free — No Credit Card Required
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', lineHeight: '1.1',
          margin: '0 0 20px', letterSpacing: '-1px',
        }}>
          Stop Guessing.<br />
          <span style={{ color: theme.primary }}>Stock What Sells.</span>
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: theme.textSecondary,
          maxWidth: '640px', margin: '0 auto 32px', lineHeight: '1.6',
          padding: isMobile ? '0 8px' : 0,
        }}>
          IDDI is the free vending machine management platform that tracks inventory, optimizes routes, and lets your customers tell you what to stock — via QR polls on every machine.
        </p>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? '0 16px' : 0,
        }}>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: isMobile ? '16px 24px' : '16px 40px',
            borderRadius: '8px', fontWeight: '700', fontSize: isMobile ? '16px' : '18px',
            transition: 'transform 0.2s', display: 'block',
            width: isMobile ? '100%' : 'auto',
            textAlign: 'center', boxSizing: 'border-box',
          }}>
            Start Free — Takes 2 Minutes
          </Link>
          <Link to="/vending-machine-profit-calculator" style={{
            backgroundColor: 'transparent', color: theme.primary, textDecoration: 'none',
            padding: isMobile ? '16px 24px' : '16px 32px',
            borderRadius: '8px', fontWeight: '600', fontSize: isMobile ? '16px' : '18px',
            border: `2px solid ${theme.primary}`, display: 'block',
            width: isMobile ? '100%' : 'auto',
            textAlign: 'center', boxSizing: 'border-box',
          }}>
            Calculate Your Profits
          </Link>
        </div>

        {/* Social proof bar */}
        <div style={{
          marginTop: '48px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '24px' : '32px',
          maxWidth: '560px',
          margin: '48px auto 0',
          textAlign: 'center',
        }}>
          <div>
            <span style={{ color: theme.text, fontWeight: '700', fontSize: '24px', display: 'block' }}>{machineCount}+</span>
            <span style={{ color: theme.textMuted, fontSize: '14px' }}>Machines Managed</span>
          </div>
          <div>
            <span style={{ color: theme.text, fontWeight: '700', fontSize: '24px', display: 'block' }}>10K+</span>
            <span style={{ color: theme.textMuted, fontSize: '14px' }}>Customer Votes</span>
          </div>
          <div>
            <span style={{ color: theme.text, fontWeight: '700', fontSize: '24px', display: 'block' }}>$0</span>
            <span style={{ color: theme.textMuted, fontSize: '14px' }}>Forever Free Tier</span>
          </div>
        </div>
      </section>

      {/* Interactive Swipe Demo */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        maxWidth: '900px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '32px' : '48px',
          alignItems: 'center',
        }}>
          {/* Left: explanation */}
          <div style={{ order: isMobile ? 2 : 1 }}>
            <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.2' }}>
              Your Customers<br />
              <span style={{ color: theme.primary }}>Choose What You Stock</span>
            </h2>
            <p style={{ color: theme.textSecondary, fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>
              Stick a QR code on your machine. Customers scan it and swipe through products in seconds
              — just like a dating app. They tell you what they want, and you stock it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                'Customers scan the QR code on your machine',
                'They swipe right on products they want, left on ones they don\'t',
                'You see the results and stock what actually sells',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: theme.primary + '20', color: theme.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700',
                  }}>{i + 1}</span>
                  <span style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.5' }}>{step}</span>
                </div>
              ))}
            </div>
            <p style={{
              color: theme.textMuted, fontSize: '13px', fontStyle: 'italic', margin: 0,
            }}>
              Try it yourself — swipe the cards on the {isMobile ? 'screen' : 'right'}.
            </p>
          </div>

          {/* Right: interactive demo */}
          <div style={{ order: isMobile ? 1 : 2 }}>
            <div style={{
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: '20px',
              padding: '24px 16px',
              boxShadow: `0 0 40px ${theme.primary}08`,
            }}>
              {/* Phone-like header */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Live Demo — Try It
                </span>
              </div>
              <SwipeDemo isMobile={isMobile} />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Tour */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        maxWidth: '900px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '32px' : '48px',
          alignItems: 'center',
        }}>
          {/* Left: explanation */}
          <div style={{ order: isMobile ? 2 : 1 }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '11px',
              backgroundColor: theme.secondary + '15', color: theme.secondary, fontWeight: '600',
              marginBottom: '16px', border: `1px solid ${theme.secondary}30`,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Interactive Tour
            </div>
            <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.2' }}>
              See the Operator Side<br />
              <span style={{ color: theme.primary }}>Before You Sign Up</span>
            </h2>
            <p style={{ color: theme.textSecondary, fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>
              No signup wall. No guessing what the app looks like. Walk through every feature of your
              dashboard in 30 seconds — from adding your first machine to seeing real customer data drive
              your decisions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { color: theme.success, text: 'Add machines, load products, generate QR codes' },
                { color: theme.warning, text: 'Watch customer votes roll in and shape your inventory' },
                { color: theme.secondary, text: 'Catch spoilage, optimize routes, grow profits' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: item.color,
                  }} />
                  <span style={{ fontSize: '14px', color: theme.textSecondary }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: interactive demo */}
          <div style={{ order: isMobile ? 1 : 2 }}>
            <InteractiveDemo isMobile={isMobile} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: isMobile ? '48px 16px' : '60px 24px', maxWidth: '1100px', margin: '0 auto', borderTop: `1px solid ${theme.border}` }}>
        <h2 style={{ textAlign: 'center', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '12px' }}>
          Everything You Need to Run Smarter
        </h2>
        <p style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: '48px', fontSize: '16px' }}>
          The features enterprise operators pay thousands for — free for everyone.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: '12px', padding: isMobile ? '24px 20px' : '28px',
              transition: 'border-color 0.2s, transform 0.2s',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>{f.title}</h3>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: isMobile ? '48px 16px' : '60px 24px',
        maxWidth: '900px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{ textAlign: 'center', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '48px' }}>
          Up and Running in 4 Steps
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '32px',
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: theme.primary + '20', color: theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: '800', margin: '0 auto 16px',
              }}>
                {s.num}
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>{s.title}</h3>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px', lineHeight: '1.5' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Works With Your Existing Setup */}
      <section style={{
        padding: isMobile ? '48px 16px' : '60px 24px',
        maxWidth: '900px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{ textAlign: 'center', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '12px' }}>
          Works With Your Existing Setup
        </h2>
        <p style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px' }}>
          IDDI is a separate, standalone platform — you add your machines and products manually.
          It doesn't plug into your payment or telemetry hardware directly, so it complements
          whatever system you already run.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '16px',
        }}>
          {integrations.map((item, i) => (
            <div key={i} style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px', padding: isMobile ? '20px' : '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>{item.name}</h3>
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: theme.success + '15', color: theme.success,
                }}>
                  {item.what}
                </span>
              </div>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
                {item.how}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center', marginTop: '32px', padding: '20px',
          backgroundColor: theme.primary + '08', borderRadius: '12px',
          border: `1px solid ${theme.primary}20`,
        }}>
          <p style={{ margin: 0, color: theme.textSecondary, fontSize: '15px' }}>
            Already using Cantaloupe, Nayax, Vendera, HahaVending, or any other system?{' '}
            <strong style={{ color: theme.text }}>IDDI runs independently alongside it</strong> — you enter your
            products manually, and IDDI adds what they don't: customer polling, spoilage optimization,
            and product-level intelligence. Free.
          </p>
        </div>
      </section>

      {/* ROI / Value Proposition */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        borderTop: `1px solid ${theme.border}`,
        maxWidth: '900px', margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '12px' }}>
          The Numbers Behind IDDI
        </h2>
        <p style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: '36px', fontSize: '15px', maxWidth: '600px', margin: '0 auto 36px' }}>
          Based on what IDDI tracks — customer demand, product performance, and spoilage — here is the average impact operators see.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: theme.success, marginBottom: '8px' }}>+18%</div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>More Sales</div>
            <p style={{ color: theme.textSecondary, fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Stocking products customers actually vote for means fewer items sitting unsold and more revenue per machine.
            </p>
          </div>
          <div style={{
            backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: theme.warning, marginBottom: '8px' }}>-25%</div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Less Spoilage</div>
            <p style={{ color: theme.textSecondary, fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Expiration tracking and smart reorder alerts catch products before they expire. Less waste, more margin.
            </p>
          </div>
          <div style={{
            backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: theme.primary, marginBottom: '8px' }}>2x</div>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Better Customer Engagement</div>
            <p style={{ color: theme.textSecondary, fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Customers who scan and vote feel heard. That loyalty means repeat visits and more transactions per machine.
            </p>
          </div>
        </div>

        {/* Concrete example */}
        <div style={{
          backgroundColor: theme.primary + '08', border: `1px solid ${theme.primary}25`,
          borderRadius: '12px', padding: isMobile ? '24px 20px' : '28px 32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '15px', color: theme.textSecondary, margin: '0 0 12px', lineHeight: '1.7' }}>
            <strong style={{ color: theme.text }}>Example:</strong> An operator with 5 machines averaging $400/month revenue each.
            With IDDI's product optimization and spoilage reduction, that is an estimated
          </p>
          <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', color: theme.success, marginBottom: '8px' }}>
            +$135/month in extra profit
          </div>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: '0 0 16px' }}>
            That is $1,620 more per year — for a tool that starts free.
          </p>
          <Link to="/vending-machine-profit-calculator" style={{
            color: theme.primary, textDecoration: 'none', fontSize: '14px', fontWeight: '600',
          }}>
            Calculate your own numbers
          </Link>
        </div>
      </section>

      {/* Lead Capture */}
      <section style={{
        padding: isMobile ? '48px 16px' : '60px 24px',
        maxWidth: '700px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <LeadCapture
          headline="Get Your Free Vending Startup Kit"
          description="Product selection templates, location scorecards, and profit tracking sheets — delivered to your inbox."
          leadMagnet="Vending Startup Kit"
          source="homepage"
        />
      </section>

      {/* Final CTA */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        textAlign: 'center',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '700', marginBottom: '16px' }}>
          Start Increasing Your Profits Today
        </h2>
        <p style={{ color: theme.textSecondary, fontSize: isMobile ? '16px' : '18px', marginBottom: '32px', maxWidth: '540px', margin: '0 auto 32px', lineHeight: '1.6' }}>
          Set up your first machine in 2 minutes. Let your customers tell you what to stock.
          Watch your profits grow. Free to start — no credit card, no catch.
        </p>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: isMobile ? '16px 24px' : '18px 48px',
          borderRadius: '8px', fontWeight: '700', fontSize: '18px',
          display: isMobile ? 'block' : 'inline-block',
          margin: isMobile ? '0 16px' : undefined,
          textAlign: 'center',
        }}>
          Get Started Free
        </Link>
      </section>

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        headline="Before You Go..."
        description="Get our free Vending Profit Cheat Sheet — the exact numbers operators use to maximize every machine."
        leadMagnet="Vending Profit Cheat Sheet"
        source="homepage-exit"
      />

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${theme.border}`,
        padding: isMobile ? '32px 16px' : '40px 24px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          gap: '32px',
        }}>
          <div>
            <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '3px' }}>IDDI</span>
            <p style={{ color: theme.textMuted, fontSize: '13px', marginTop: '8px' }}>
              Free vending machine management for everyone.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, auto)',
            gap: isMobile ? '24px' : '48px',
          }}>
            <div>
              <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/for-vendors" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>For Vendors</Link>
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
            <div>
              <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Works With</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Cantaloupe</span>
                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Nayax</span>
                <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Vendera</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
