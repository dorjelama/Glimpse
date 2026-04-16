'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Project, CanvasElement, Page } from '@/lib/api';
import TextElement from '../../editor/components/elements/TextElement';
import ImageElement from '../../editor/components/elements/ImageElement';
import ShapeElement from '../../editor/components/elements/ShapeElement';
import ButtonElement from '../../editor/components/elements/ButtonElement';
import DividerElement from '../../editor/components/elements/DividerElement';
import GuestNameElement from '../../editor/components/elements/GuestNameElement';
import CountdownElement from '../../editor/components/elements/CountdownElement';

interface Props {
  project: Project;
  guestName?: string;
}

function renderElement(el: CanvasElement, guestName?: string) {
  switch (el.type) {
    case 'text':      return <TextElement element={el} isSelected={false} isPreview={true} />;
    case 'image':     return <ImageElement element={el} />;
    case 'shape':     return <ShapeElement element={el} />;
    case 'button':    return <ButtonElement element={el} isPreview />;
    case 'divider':   return <DividerElement element={el} />;
    case 'guestname': return <GuestNameElement element={el} guestName={guestName} isPreview />;
    case 'countdown': return <CountdownElement element={el} />;
    default:          return null;
  }
}

// Button elements are interactive in the viewer; all others are non-interactive.
const INTERACTIVE_TYPES = new Set(['button']);

function PageBlock({ page, canvasWidth, canvasHeight, scale, guestName }: {
  page: Page;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  guestName?: string;
}) {
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
  const scaledWidth  = canvasWidth  * scale;
  const scaledHeight = canvasHeight * scale;

  return (
    /*
     * Outer div occupies the scaled dimensions in normal document flow.
     * Inner div is the full canvas size, scaled from top-left via transform.
     */
    <div style={{ width: scaledWidth, height: scaledHeight, position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: page.backgroundColor,
          backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        {sorted.map((el) => (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              zIndex: el.zIndex,
              // Allow interactive element types to receive pointer events
              pointerEvents: INTERACTIVE_TYPES.has(el.type) ? 'auto' : 'none',
            }}
          >
            {renderElement(el, guestName)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transition durations ─────────────────────────────────────────────────────

const FADE_MS  = 300;
const SLIDE_MS = 350;
const FLIP_MS  = 200; // per half (total 400ms)

// ─── Main component ───────────────────────────────────────────────────────────

export default function PreviewCanvas({ project, guestName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Transition visual state
  const [outStyle, setOutStyle] = useState<React.CSSProperties>({});
  const [inStyle,  setInStyle]  = useState<React.CSSProperties>({});
  const [showBoth, setShowBoth] = useState(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);

  // Swipe hint — shown on mount for multi-page, auto-fades after 3 glow cycles
  const [swipeHint, setSwipeHint] = useState<'visible' | 'fading' | 'gone'>('visible');

  const canvasWidth  = project.canvas.width;
  const canvasHeight = project.canvas.height;

  // ── Scale to fit ────────────────────────────────────────────────────────────
  // On mobile: fit by width, allow vertical scroll.
  // On desktop: fit both axes so the whole page is visible without scrolling.

  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 640;
    const hPad = isMobile ? 16 : 64;
    // Reserve vertical room for dots + start-over button below the canvas
    const vReserve = isMobile ? 80 : 120;

    const byWidth  = (clientWidth  - hPad)     / canvasWidth;
    const byHeight = (clientHeight - vReserve) / canvasHeight;

    if (isMobile) {
      setScale(Math.min(byWidth, 1));
    } else {
      setScale(Math.min(byWidth, byHeight, 1));
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    fitToContainer();
    const observer = new ResizeObserver(fitToContainer);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitToContainer]);

  const pages = [...project.pages].sort((a, b) => a.order - b.order);
  const transition = project.pageTransition ?? 'none';

  // ── Navigate ────────────────────────────────────────────────────────────────

  const navigate = useCallback((dir: number) => {
    if (animating) return;
    const target = currentIndex + dir;
    if (target < 0 || target >= pages.length) return;

    if (transition === 'none') {
      setCurrentIndex(target);
      return;
    }

    setAnimating(true);
    setNextIndex(target);

    if (transition === 'fade') {
      setOutStyle({ opacity: 1, transition: `opacity ${FADE_MS}ms ease` });
      setInStyle({ opacity: 0, transition: `opacity ${FADE_MS}ms ease` });
      setShowBoth(true);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        setOutStyle({ opacity: 0, transition: `opacity ${FADE_MS}ms ease` });
        setInStyle({ opacity: 1,  transition: `opacity ${FADE_MS}ms ease` });
      }));

      setTimeout(() => {
        setCurrentIndex(target);
        setShowBoth(false);
        setNextIndex(null);
        setOutStyle({});
        setInStyle({});
        setAnimating(false);
      }, FADE_MS + 20);

    } else if (transition === 'slide') {
      const fromX =  dir * 100;
      const toX   = -dir * 100;

      setOutStyle({ transform: 'translateX(0%)',       transition: `transform ${SLIDE_MS}ms ease` });
      setInStyle({ transform: `translateX(${fromX}%)`, transition: `transform ${SLIDE_MS}ms ease` });
      setShowBoth(true);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        setOutStyle({ transform: `translateX(${toX}%)`, transition: `transform ${SLIDE_MS}ms ease` });
        setInStyle({ transform: 'translateX(0%)',        transition: `transform ${SLIDE_MS}ms ease` });
      }));

      setTimeout(() => {
        setCurrentIndex(target);
        setShowBoth(false);
        setNextIndex(null);
        setOutStyle({});
        setInStyle({});
        setAnimating(false);
      }, SLIDE_MS + 20);

    } else if (transition === 'flip') {
      setOutStyle({
        transform: 'perspective(1200px) rotateY(0deg)',
        transition: `transform ${FLIP_MS}ms ease-in`,
        backfaceVisibility: 'hidden',
      });
      setShowBoth(false);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        setOutStyle({
          transform: `perspective(1200px) rotateY(${dir * 90}deg)`,
          transition: `transform ${FLIP_MS}ms ease-in`,
          backfaceVisibility: 'hidden',
        });
      }));

      setTimeout(() => {
        setCurrentIndex(target);
        setOutStyle({});
        setInStyle({
          transform: `perspective(1200px) rotateY(${-dir * 90}deg)`,
          transition: `transform ${FLIP_MS}ms ease-out`,
          backfaceVisibility: 'hidden',
        });

        requestAnimationFrame(() => requestAnimationFrame(() => {
          setInStyle({
            transform: 'perspective(1200px) rotateY(0deg)',
            transition: `transform ${FLIP_MS}ms ease-out`,
            backfaceVisibility: 'hidden',
          });
        }));

        setTimeout(() => {
          setInStyle({});
          setAnimating(false);
          setNextIndex(null);
        }, FLIP_MS + 20);
      }, FLIP_MS + 20);
    }
  }, [animating, currentIndex, pages.length, transition]);

  // ── Swipe hint lifecycle ─────────────────────────────────────────────────────
  // 3 glow cycles × 1.6 s = 4.8 s, then 0.7 s fade-out, then unmount.

  useEffect(() => {
    if (pages.length <= 1) { setSwipeHint('gone'); return; }
    const fade   = setTimeout(() => setSwipeHint('fading'), 4800);
    const remove = setTimeout(() => setSwipeHint('gone'),   5500);
    return () => { clearTimeout(fade); clearTimeout(remove); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss immediately once the user navigates
  useEffect(() => {
    if (currentIndex !== 0 && swipeHint !== 'gone') {
      setSwipeHint('fading');
      const t = setTimeout(() => setSwipeHint('gone'), 500);
      return () => clearTimeout(t);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard navigation ──────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft')  navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // ── Touch swipe ──────────────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
  }, [navigate]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const scaledW = canvasWidth  * scale;
  const scaledH = canvasHeight * scale;

  return (
    <div ref={containerRef} className="flex-1 overflow-auto bg-canvas">
      <div className="flex flex-col items-center py-8">

        {/* Canvas + overlay arrows */}
        <div
          style={{ position: 'relative', width: scaledW, height: scaledH }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pages — clipped within canvas bounds; click left/right half to navigate on desktop */}
          <div
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: pages.length > 1 ? 'pointer' : 'default' }}
            onClick={(e) => {
              if (pages.length <= 1) return;
              const { left, width } = e.currentTarget.getBoundingClientRect();
              navigate(e.clientX - left < width / 2 ? -1 : 1);
            }}
          >
            {showBoth && nextIndex !== null ? (
              <div style={{ position: 'relative', width: scaledW, height: scaledH }}>
                <div style={{ position: 'absolute', top: 0, left: 0, ...outStyle }}>
                  <PageBlock page={pages[currentIndex]} canvasWidth={canvasWidth} canvasHeight={canvasHeight} scale={scale} guestName={guestName} />
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, ...inStyle }}>
                  <PageBlock page={pages[nextIndex]} canvasWidth={canvasWidth} canvasHeight={canvasHeight} scale={scale} guestName={guestName} />
                </div>
              </div>
            ) : (
              <div style={Object.keys(inStyle).length > 0 ? inStyle : outStyle}>
                <PageBlock page={pages[currentIndex]} canvasWidth={canvasWidth} canvasHeight={canvasHeight} scale={scale} guestName={guestName} />
              </div>
            )}
          </div>

          {/* Swipe hint */}
          {swipeHint !== 'gone' && (
            <>
              <style>{`
                @keyframes _glimpse-glow {
                  0%, 100% {
                    border-color: rgba(255,255,255,0.35);
                    box-shadow: 0 0 0 0 rgba(255,255,255,0);
                  }
                  50% {
                    border-color: rgba(255,255,255,0.95);
                    box-shadow: 0 0 0 10px rgba(255,255,255,0.08), 0 0 24px rgba(255,255,255,0.35);
                  }
                }
                @keyframes _glimpse-arrow {
                  0%   { transform: translateX(5px); opacity: 0.4; }
                  40%  { transform: translateX(-5px); opacity: 1; }
                  70%  { transform: translateX(-5px); opacity: 1; }
                  100% { transform: translateX(5px); opacity: 0.4; }
                }
                .glimpse-swipe-ring {
                  animation: _glimpse-glow 1.6s ease-in-out 3;
                }
                .glimpse-swipe-arrow {
                  animation: _glimpse-arrow 1.6s ease-in-out 3;
                }
              `}</style>

              <div
                style={{
                  position: 'absolute',
                  bottom: 28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  opacity: swipeHint === 'fading' ? 0 : 1,
                  transition: swipeHint === 'fading' ? 'opacity 0.6s ease' : 'none',
                }}
              >
                {/* Glowing ring */}
                <div
                  className="glimpse-swipe-ring"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                  }}
                >
                  {/* Left-pointing chevron — slides left inside the ring */}
                  <svg
                    className="glimpse-swipe-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M13 3 L5 10 L13 17"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Label */}
                <span
                  style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    opacity: 0.75,
                  }}
                >
                  Swipe
                </span>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
