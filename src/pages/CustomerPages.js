import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customerAPI } from '../services/api';
import { theme, styles } from '../shared/theme';
import { useToast } from '../shared/toast';

function CustomerMachine() {
  const { qr_token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initData, setInitData] = useState(null);

  useEffect(() => {
    const initMachine = async () => {
      try {
        // Single API call does everything: resolve QR, create session, check completion, load polls
        const response = await customerAPI.initSession(qr_token);
        const data = response.data.data;

        localStorage.setItem('token', data.sessionToken);
        localStorage.setItem('selectedMachineId', data.machine.id.toString());

        // Preload product images immediately so they're cached by the time user sees them
        if (data.products && data.products.length > 0) {
          data.products.forEach(p => {
            if (p.image_url) {
              const img = new Image();
              img.src = p.image_url;
            }
          });
        }

        setInitData(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to access machine');
        setLoading(false);
      }
    };

    initMachine();
  }, [qr_token]);

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div className="spinner" style={{ width: '48px', height: '48px', border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Connecting to machine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: theme.danger }}>{error}</p>
          <Link to="/" style={{ ...styles.button, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return <CustomerSwipe initData={initData} />;
}

function CustomerSwipe({ initData }) {
  const machineId = initData.machine.id;
  const [poll, setPoll] = useState(initData.poll);
  const [products, setProducts] = useState(initData.products || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(!initData.poll || (initData.products || []).length === 0);
  const [alreadyVoted, setAlreadyVoted] = useState(initData.alreadyVoted || false);
  const [loading] = useState(false); // No loading needed - data arrives via props
  const [swiping, setSwiping] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [cardEntering, setCardEntering] = useState(true);
  const cardRef = useRef(null);
  const toast = useToast();
  const nextPollDate = initData.nextPollDate;

  // Touch/swipe state
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const SWIPE_THRESHOLD = 80;

  const handleSubmitSuggestion = async () => {
    if (!suggestion.trim()) return;
    setSubmittingSuggestion(true);
    try {
      await customerAPI.submitSuggestion(suggestion.trim());
      setSuggestionSubmitted(true);
      setSuggestion('');
    } catch (err) {
      toast.error('Failed to submit suggestion');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const advanceCard = useCallback(() => {
    setSwiping(null);
    setDragOffset(0);
    if (currentIndex < products.length - 1) {
      setCardEntering(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setCardEntering(false), 400);
    } else {
      // Mark completion
      const localKey = `iddi_poll_completed_machine_${machineId}`;
      localStorage.setItem(localKey, Date.now().toString());
      setCompleted(true);
    }
  }, [currentIndex, products.length, machineId]);

  const handleVote = useCallback(async (voteType) => {
    if (!poll || !products[currentIndex] || swiping) return;

    setSwiping(voteType);

    try {
      await customerAPI.votePoll(poll.id, {
        optionId: products[currentIndex].id,
        voteType
      });

      setTimeout(advanceCard, 350);
    } catch (err) {
      setSwiping(null);
      setDragOffset(0);
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  }, [poll, products, currentIndex, swiping, advanceCard, toast]);

  // Touch handlers for swipe gesture
  const handleTouchStart = useCallback((e) => {
    if (swiping) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, [swiping]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || swiping) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    setDragOffset(dx);
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

  // Reset card entering state on first render
  useEffect(() => {
    if (!loading && products.length > 0) {
      const timer = setTimeout(() => setCardEntering(false), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, products.length]);

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Loading poll...</p>
        </div>
      </div>
    );
  }

  // Already voted screen
  if (alreadyVoted) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ ...styles.card, maxWidth: '400px', width: '100%', padding: '32px 24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: theme.primary + '20', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '40px'
          }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>You've Already Voted!</h2>
          <p style={{ color: theme.textSecondary, margin: '0 0 8px 0', lineHeight: '1.6' }}>
            Your feedback has been recorded. Thanks for helping us improve!
          </p>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
            {nextPollDate ? `Next poll opens ${new Date(nextPollDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : 'Check back next month!'}
          </p>

          {/* Powered by IDDI */}
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <a
              href={`/for-vendors?utm_source=qr&utm_medium=customer&utm_campaign=powered_by&machine=${machineId}`}
              style={{
                display: 'block', padding: '12px', borderRadius: '8px', textDecoration: 'none',
                backgroundColor: theme.primary + '08', border: `1px solid ${theme.primary}20`,
                textAlign: 'center',
              }}
            >
              <span style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '2px' }}>Powered by</span>
              <span style={{ color: theme.primary, fontWeight: '700', fontSize: '16px' }}>IDDI</span>
              <span style={{ color: theme.textSecondary, fontSize: '12px', display: 'block', marginTop: '2px' }}>Want this for YOUR machines? It's free →</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ ...styles.card, maxWidth: '400px', width: '100%', padding: '32px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Thank You!</h2>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            Your feedback helps us stock better products.
          </p>

          {/* Product Suggestion Box */}
          <div style={{
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '24px',
            marginTop: '8px'
          }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '16px' }}>
              Want something we don't carry?
            </p>
            <p style={{ margin: '0 0 16px 0', color: theme.textMuted, fontSize: '14px' }}>
              Tell us and we'll consider adding it!
            </p>
            {suggestionSubmitted ? (
              <div style={{
                backgroundColor: theme.success + '20',
                border: `1px solid ${theme.success}`,
                borderRadius: '8px',
                padding: '16px',
                color: theme.success,
                fontWeight: '500'
              }}>
                ✓ Thanks! Your suggestion was sent to the vendor.
              </div>
            ) : (
              <div>
                <textarea
                  placeholder="e.g., Takis, Celsius Energy, Kind Bars..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  maxLength={255}
                  rows={3}
                  style={{
                    ...styles.input,
                    width: '100%',
                    marginBottom: '4px',
                    textAlign: 'left',
                    resize: 'none',
                    minHeight: '80px',
                    fontSize: '16px',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '12px', color: theme.textMuted, marginBottom: '12px' }}>
                  {suggestion.length}/255
                </div>
                <button
                  onClick={handleSubmitSuggestion}
                  disabled={!suggestion.trim() || submittingSuggestion}
                  style={{
                    ...styles.button,
                    width: '100%',
                    opacity: !suggestion.trim() || submittingSuggestion ? 0.5 : 1,
                    fontSize: '16px',
                    padding: '14px',
                  }}
                >
                  {submittingSuggestion ? 'Sending...' : 'Submit Suggestion'}
                </button>
              </div>
            )}
          </div>

          {/* Share & Powered by IDDI */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => navigator.share({
                  title: 'Vote on vending machine products!',
                  text: 'I just voted on what this vending machine should stock. You can too!',
                  url: window.location.href,
                })}
                style={{
                  display: 'block', width: '100%', marginBottom: '12px',
                  padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  backgroundColor: theme.primary + '15', color: theme.primary,
                  border: `1px solid ${theme.primary}30`, cursor: 'pointer',
                }}
              >
                📤 Share This Poll With Friends
              </button>
            )}
            <a
              href={`/for-vendors?utm_source=qr&utm_medium=customer&utm_campaign=powered_by&machine=${machineId}`}
              style={{
                display: 'block', padding: '12px', borderRadius: '8px', textDecoration: 'none',
                backgroundColor: theme.primary + '08', border: `1px solid ${theme.primary}20`,
                textAlign: 'center',
              }}
            >
              <span style={{ color: theme.textMuted, fontSize: '12px', display: 'block', marginBottom: '2px' }}>Powered by</span>
              <span style={{ color: theme.primary, fontWeight: '700', fontSize: '16px' }}>IDDI</span>
              <span style={{ color: theme.textSecondary, fontSize: '12px', display: 'block', marginTop: '2px' }}>Want this for YOUR machines? It's free →</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const progress = `${currentIndex + 1} / ${products.length}`;
  const dragRotation = dragOffset * 0.08;
  const dragOpacity = Math.max(0.4, 1 - Math.abs(dragOffset) / 300);

  // Compute card transform
  let cardTransform;
  let cardTransition;
  let cardBorderColor = theme.border;
  if (swiping === 'like') {
    cardTransform = 'translateX(120%) rotate(15deg)';
    cardTransition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s, border-color 0.2s';
    cardBorderColor = theme.success;
  } else if (swiping === 'dislike') {
    cardTransform = 'translateX(-120%) rotate(-15deg)';
    cardTransition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s, border-color 0.2s';
    cardBorderColor = theme.danger;
  } else if (isDragging) {
    cardTransform = `translateX(${dragOffset}px) rotate(${dragRotation}deg)`;
    cardTransition = 'none';
    if (dragOffset > 30) cardBorderColor = theme.success;
    else if (dragOffset < -30) cardBorderColor = theme.danger;
  } else if (cardEntering) {
    cardTransform = 'scale(0.95)';
    cardTransition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s';
  } else {
    cardTransform = 'translateX(0) rotate(0deg)';
    cardTransition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s';
  }

  // Swipe indicator overlays
  const showLikeIndicator = dragOffset > 30 || swiping === 'like';
  const showDislikeIndicator = dragOffset < -30 || swiping === 'dislike';
  const indicatorOpacity = swiping ? 1 : Math.min(1, Math.abs(dragOffset) / SWIPE_THRESHOLD);

  return (
    <div style={{
      ...styles.page,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {poll?.pollType && (
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              backgroundColor: poll.pollType === 'discovery' ? theme.secondary + '20' : theme.primary + '20',
              color: poll.pollType === 'discovery' ? theme.secondary : theme.primary
            }}>
              {poll.pollType === 'discovery' ? 'New Products' : 'Help Us Improve'}
            </span>
          </div>
        )}
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{poll?.question || 'Which products do you want?'}</h2>
        <p style={{ color: theme.textSecondary, margin: 0, fontSize: '14px' }}>{progress}</p>

        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: theme.surfaceHover, borderRadius: '2px', marginTop: '12px' }}>
          <div style={{
            height: '100%',
            width: `${((currentIndex + 1) / products.length) * 100}%`,
            backgroundColor: theme.primary,
            borderRadius: '2px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>

      {/* Swipe instruction - only show on first card */}
      {currentIndex === 0 && !swiping && !isDragging && (
        <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', marginBottom: '8px' }}>
          Swipe right to keep, left to pass
        </div>
      )}

      {/* Card Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        touchAction: 'pan-y',
      }}>
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            ...styles.card,
            width: '100%',
            maxWidth: '350px',
            textAlign: 'center',
            position: 'relative',
            transform: cardTransform,
            transition: cardTransition,
            opacity: swiping ? 0.6 : dragOpacity,
            borderColor: cardBorderColor,
            borderWidth: '2px',
            boxShadow: isDragging
              ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${cardBorderColor}40`
              : '0 4px 20px rgba(0,0,0,0.2)',
            cursor: 'grab',
          }}
        >
          {/* Swipe indicator overlays */}
          {showLikeIndicator && (
            <div style={{
              position: 'absolute', top: '16px', left: '16px', zIndex: 10,
              padding: '6px 16px', borderRadius: '8px',
              border: `3px solid ${theme.success}`, color: theme.success,
              fontSize: '24px', fontWeight: '800', letterSpacing: '2px',
              transform: 'rotate(-15deg)', opacity: indicatorOpacity,
              textTransform: 'uppercase',
            }}>
              WANT
            </div>
          )}
          {showDislikeIndicator && (
            <div style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10,
              padding: '6px 16px', borderRadius: '8px',
              border: `3px solid ${theme.danger}`, color: theme.danger,
              fontSize: '24px', fontWeight: '800', letterSpacing: '2px',
              transform: 'rotate(15deg)', opacity: indicatorOpacity,
              textTransform: 'uppercase',
            }}>
              PASS
            </div>
          )}

          {/* Color gradient overlay during drag */}
          {isDragging && Math.abs(dragOffset) > 20 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '10px', pointerEvents: 'none', zIndex: 5,
              background: dragOffset > 0
                ? `linear-gradient(90deg, transparent 40%, ${theme.success}15 100%)`
                : `linear-gradient(270deg, transparent 40%, ${theme.danger}15 100%)`,
              transition: 'opacity 0.1s',
            }} />
          )}

          {currentProduct?.image_url ? (
            <>
              <img
                src={currentProduct.image_url}
                alt={currentProduct.product_name}
                draggable={false}
                style={{
                  width: '100%',
                  height: '250px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  pointerEvents: 'none',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                width: '100%',
                height: '200px',
                backgroundColor: theme.surfaceHover,
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', opacity: 0.3, color: theme.textMuted }}>No items</span>
                <span style={{ color: theme.textMuted, fontSize: '14px', padding: '0 20px', textAlign: 'center' }}>
                  {currentProduct?.product_name}
                </span>
              </div>
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: theme.surfaceHover,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', opacity: 0.3, color: theme.textMuted }}>No items</span>
              <span style={{ color: theme.textMuted, fontSize: '14px', padding: '0 20px', textAlign: 'center' }}>
                {currentProduct?.product_name}
              </span>
            </div>
          )}
          <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', position: 'relative', zIndex: 6 }}>{currentProduct?.product_name}</h3>
          {currentProduct?.price && (
            <p style={{ margin: 0, fontSize: '16px', color: theme.success, fontWeight: '600', position: 'relative', zIndex: 6 }}>
              ${parseFloat(currentProduct.price).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', padding: '20px 0 12px' }} role="group" aria-label="Vote on product">
        <button
          onClick={() => handleVote('dislike')}
          disabled={!!swiping}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: `3px solid ${theme.danger}`,
            backgroundColor: 'transparent',
            color: theme.danger,
            fontSize: '28px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 20px ${theme.danger}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minHeight: 'unset',
            minWidth: 'unset',
          }}
          aria-label="Pass on this product"
          title="Pass"
        >
          ✗
        </button>
        <button
          onClick={() => handleVote('like')}
          disabled={!!swiping}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: `3px solid ${theme.success}`,
            backgroundColor: 'transparent',
            color: theme.success,
            fontSize: '28px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 20px ${theme.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minHeight: 'unset',
            minWidth: 'unset',
          }}
          aria-label="Want this product"
          title="Want it"
        >
          ✓
        </button>
      </div>

      <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', paddingBottom: '8px' }}>
        ✗ Pass &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Want it
      </div>

      {/* Powered by IDDI - persistent footer */}
      <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
        <a
          href={`/for-vendors?utm_source=qr&utm_medium=customer&utm_campaign=powered_by&machine=${machineId}`}
          style={{ color: theme.textMuted, textDecoration: 'none', fontSize: '12px' }}
        >
          Powered by <span style={{ color: theme.primary, fontWeight: '600' }}>IDDI</span>
        </a>
      </div>
    </div>
  );
}

// ============================================
// SUGGESTIONS MANAGEMENT
// ============================================


export { CustomerMachine, CustomerSwipe };
