import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '../shared/theme';
import { vendorAPI } from '../services/api';

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

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    machines: '1 machine',
    highlight: false,
    badge: null,
    buttonText: 'Get Started Free',
    description: 'Try every feature on your best machine. No card required.',
    features: [
      'Full dashboard and QR codes',
      'Product library',
      'Customer polling via QR',
      'Inventory tracking and recount',
      'Performance marking',
      'Smart reorder suggestions',
      'Spoilage and expiration alerts',
    ],
  },
  {
    name: 'Growth',
    price: '$19',
    period: '/mo',
    machines: 'Up to 10 machines',
    highlight: true,
    badge: 'Most Popular',
    buttonText: 'Start 7-Day Free Trial',
    trial: '7-day free trial, cancel anytime',
    description: 'Everything you need to run a growing vending operation.',
    features: [
      'Everything in Free',
      'Up to 10 machines',
      'Visit and restock workflow',
      'Customer suggestions inbox',
      'Shared performance reports',
      'Expiration tracking across machines',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    machines: 'Up to 30 machines',
    highlight: false,
    badge: null,
    buttonText: 'Start 7-Day Free Trial',
    trial: '7-day free trial, cancel anytime',
    description: 'Advanced insights for operators scaling past 10 machines.',
    features: [
      'Everything in Growth',
      'Up to 30 machines',
      'Top 50 product rankings',
      'Route optimization',
      'Advanced analytics dashboard',
    ],
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    machines: 'Up to 100 machines',
    highlight: false,
    badge: null,
    buttonText: 'Start 7-Day Free Trial',
    trial: '7-day free trial, cancel anytime',
    description: 'For established operations with large machine fleets.',
    features: [
      'Everything in Pro',
      'Up to 100 machines',
      'Priority support',
      'Custom reporting (coming soon)',
    ],
  },
];

const comparisonFeatures = [
  { name: 'Machines', free: '1', growth: '10', pro: '30', business: '100' },
  { name: 'Dashboard and QR codes', free: true, growth: true, pro: true, business: true },
  { name: 'Product library', free: true, growth: true, pro: true, business: true },
  { name: 'Customer polling via QR', free: true, growth: true, pro: true, business: true },
  { name: 'Inventory tracking and recount', free: true, growth: true, pro: true, business: true },
  { name: 'Performance marking', free: true, growth: true, pro: true, business: true },
  { name: 'Smart reorder suggestions', free: true, growth: true, pro: true, business: true },
  { name: 'Spoilage and expiration alerts', free: true, growth: true, pro: true, business: true },
  { name: 'Visit and restock workflow', free: false, growth: true, pro: true, business: true },
  { name: 'Customer suggestions inbox', free: false, growth: true, pro: true, business: true },
  { name: 'Shared performance reports', free: false, growth: true, pro: true, business: true },
  { name: 'Top 50 product rankings', free: false, growth: false, pro: true, business: true },
  { name: 'Route optimization', free: false, growth: false, pro: true, business: true },
  { name: 'Advanced analytics', free: false, growth: false, pro: true, business: true },
  { name: 'Priority support', free: false, growth: false, pro: false, business: true },
];

const faqs = [
  {
    question: 'Why is the free plan limited to 1 machine?',
    answer: 'We want you to experience every feature IDDI offers on your best-performing machine. Once you see the value in real data, spoilage reduction, and customer polling, upgrading to manage more machines is a no-brainer.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately and billing is prorated. No contracts, no cancellation fees.',
  },
  {
    question: 'What happens after my 7-day trial?',
    answer: "We'll remind you before it ends. No surprise charges. If you don't choose to continue, your account simply moves to the Free plan with 1 machine.",
  },
  {
    question: 'Do I need a credit card for the free plan?',
    answer: 'No. The Free plan is free forever with no credit card required. Just sign up and start managing your machine.',
  },
  {
    question: 'What counts as a machine?',
    answer: 'Each vending machine, micro market, or smart cooler location counts as one machine toward your plan limit.',
  },
  {
    question: 'How does IDDI compare to Cantaloupe or Nayax pricing?',
    answer: 'IDDI is not a payment system competitor. Cantaloupe and Nayax charge $30-200 per machine for payment processing. IDDI is the inventory and product intelligence layer that works alongside them. At $19/mo for 10 machines, you are paying roughly $1.90 per machine for inventory management.',
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div style={{
      backgroundColor: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          color: theme.text,
          padding: isMobile ? '16px 20px' : '20px 24px',
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: '600',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span>{question}</span>
        <span style={{
          color: theme.textMuted,
          fontSize: '20px',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: isMobile ? '0 20px 16px' : '0 24px 20px',
          color: theme.textSecondary,
          fontSize: '14px',
          lineHeight: '1.7',
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function PricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const handleTierClick = async (tierName) => {
    const token = localStorage.getItem('token');
    const tierKey = tierName.toLowerCase();

    if (tierKey === 'free') {
      navigate('/vendor/login');
      return;
    }

    if (!token) {
      // Not logged in — send to login, they'll be redirected after
      navigate('/vendor/login');
      return;
    }

    // Logged in — create checkout session
    setCheckoutLoading(tierKey);
    try {
      const res = await vendorAPI.createCheckout(tierKey);
      const url = res.data?.data?.checkoutUrl;
      if (url) {
        window.location.href = url;
      } else {
        navigate('/vendor/subscription');
      }
    } catch (err) {
      navigate('/vendor/subscription');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', overflowX: 'hidden' }}>
      <Helmet>
        <title>Pricing - IDDI Vending Machine Management</title>
        <meta name="description" content="Simple, transparent pricing for IDDI vending machine management. Start free with 1 machine, all features included. Growth plans from $19/mo. No per-machine fees." />
        <link rel="canonical" href="https://iddisolutions.net/pricing" />
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
              <Link to="/pricing" style={{ color: theme.text, textDecoration: 'none', fontSize: '14px', padding: '8px 12px', fontWeight: '600' }}>
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
                color: theme.text, textDecoration: 'none', fontSize: '15px',
                padding: '12px 0', fontWeight: '600',
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
        textAlign: 'center', maxWidth: '800px', margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', lineHeight: '1.1',
          margin: '0 0 16px', letterSpacing: '-1px',
        }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 19px)', color: theme.textSecondary,
          maxWidth: '560px', margin: '0 auto', lineHeight: '1.6',
        }}>
          No per-machine fees. No hidden costs. Start free and scale when you are ready.
        </p>
      </section>

      {/* Pricing Cards */}
      <section style={{
        padding: isMobile ? '0 16px 48px' : '0 24px 60px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '20px',
          alignItems: 'stretch',
        }}>
          {tiers.map((tier) => {
            const isPro = tier.highlight;
            return (
              <div key={tier.name} style={{
                backgroundColor: theme.surface,
                border: isPro ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                borderRadius: '14px',
                padding: isMobile ? '28px 24px' : '32px 28px',
                position: 'relative',
                boxShadow: isPro ? `0 0 40px ${theme.primary}20, 0 0 80px ${theme.primary}10` : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {tier.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: theme.primary,
                    color: '#fff',
                    padding: '5px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}>
                    {tier.badge}
                  </div>
                )}

                <h3 style={{
                  margin: '0 0 8px', fontSize: '20px', fontWeight: '700',
                  color: isPro ? theme.primary : theme.text,
                }}>
                  {tier.name}
                </h3>

                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1 }}>{tier.price}</span>
                  <span style={{ color: theme.textSecondary, fontSize: '16px', marginLeft: '4px' }}>{tier.period}</span>
                </div>

                <p style={{
                  color: theme.textMuted, fontSize: '14px', margin: '0 0 4px',
                }}>
                  {tier.machines}
                </p>

                {tier.trial && (
                  <p style={{
                    color: theme.success, fontSize: '13px', fontWeight: '600',
                    margin: '0 0 0',
                  }}>
                    {tier.trial}
                  </p>
                )}

                <p style={{
                  color: theme.textSecondary, fontSize: '13px', margin: '8px 0 0',
                  lineHeight: '1.5',
                }}>
                  {tier.description}
                </p>

                <div style={{
                  margin: '24px 0',
                  borderTop: `1px solid ${theme.border}`,
                  paddingTop: '24px',
                }}>
                  {tier.features.map((feature) => (
                    <div key={feature} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      marginBottom: '12px',
                    }}>
                      <span style={{
                        color: theme.success, fontSize: '12px', fontWeight: '700',
                        flexShrink: 0, marginTop: '2px',
                        backgroundColor: theme.success + '15',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        Included
                      </span>
                      <span style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: '1.4' }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleTierClick(tier.name)}
                  disabled={checkoutLoading === tier.name.toLowerCase()}
                  style={{
                    display: 'block', width: '100%', textAlign: 'center',
                    marginTop: 'auto',
                    padding: '14px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '15px',
                    backgroundColor: isPro ? theme.primary : 'transparent',
                    color: isPro ? '#fff' : theme.primary,
                    border: isPro ? 'none' : `2px solid ${theme.primary}`,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                    opacity: checkoutLoading === tier.name.toLowerCase() ? 0.7 : 1,
                  }}
                >
                  {checkoutLoading === tier.name.toLowerCase() ? 'Redirecting...' : tier.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison */}
      <section style={{
        padding: isMobile ? '48px 16px' : '60px 24px',
        maxWidth: '900px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{
          textAlign: 'center', fontSize: isMobile ? '24px' : '32px',
          fontWeight: '700', marginBottom: '12px',
        }}>
          Compare Plans
        </h2>
        <p style={{
          textAlign: 'center', color: theme.textSecondary, marginBottom: '36px', fontSize: '16px',
        }}>
          See exactly what is included in each tier.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            minWidth: isMobile ? '580px' : 'auto',
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left', padding: '12px 16px',
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.textSecondary, fontSize: '13px', fontWeight: '600',
                }}>Feature</th>
                {['Free', 'Growth', 'Pro', 'Business'].map(plan => (
                  <th key={plan} style={{
                    textAlign: 'center', padding: '12px 10px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: plan === 'Growth' ? theme.primary : theme.textSecondary,
                    fontSize: '13px', fontWeight: plan === 'Growth' ? '700' : '600',
                    width: '75px',
                  }}>{plan}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.name}>
                  <td style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.text, fontSize: '14px',
                  }}>{row.name}</td>
                  {['free', 'growth', 'pro', 'business'].map(tier => {
                    const val = row[tier];
                    const isString = typeof val === 'string';
                    return (
                      <td key={tier} style={{
                        textAlign: 'center', padding: '10px',
                        borderBottom: `1px solid ${theme.border}`,
                        color: val ? (isString ? theme.text : theme.success) : theme.textMuted,
                        fontSize: '13px', fontWeight: val ? '600' : '400',
                      }}>{isString ? val : (val ? 'Yes' : '--')}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        padding: isMobile ? '48px 16px' : '60px 24px',
        maxWidth: '700px', margin: '0 auto',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{
          textAlign: 'center', fontSize: isMobile ? '24px' : '32px',
          fontWeight: '700', marginBottom: '12px',
        }}>
          Frequently Asked Questions
        </h2>
        <p style={{
          textAlign: 'center', color: theme.textSecondary, marginBottom: '32px', fontSize: '16px',
        }}>
          Everything you need to know about our plans.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        textAlign: 'center',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <h2 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '700', marginBottom: '16px' }}>
          Try Every Feature Free
        </h2>
        <p style={{
          color: theme.textSecondary, fontSize: isMobile ? '16px' : '18px',
          marginBottom: '32px', maxWidth: '540px', margin: '0 auto 32px',
        }}>
          Set up your first machine in under 2 minutes. All features unlocked, no credit card required. Upgrade when you are ready to add more machines.
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

export default PricingPage;
