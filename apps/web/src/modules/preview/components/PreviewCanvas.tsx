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
    case 'guestname':  return <GuestNameElement element={el} guestName={guestName} isPreview />;
    case 'countdown':  return <CountdownElement element={el} />;
    default:           return null;
  }
}

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
              pointerEvents: 'none',
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
  const [showBoth, setShowBoth] = useState(false); // render both pages during crossfade/slide
  const [nextIndex, setNextIndex] = useState<number | null>(null);

  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const padding = clientWidth < 640 ? 16 : 64;
    setScale(Math.min((clientWidth - padding) / project.canvas.width, 1));
  }, [project.canvas.width]);

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
      // Start: outgoing visible, incoming hidden
      setOutStyle({ opacity: 1, transition: `opacity ${FADE_MS}ms ease` });
      setInStyle({ opacity: 0, transition: `opacity ${FADE_MS}ms ease` });
      setShowBoth(true);

      // Trigger fade
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
      const fromX =  dir * 100; // incoming starts offscreen in direction of travel
      const toX   = -dir * 100; // outgoing exits in opposite direction

      setOutStyle({ transform: 'translateX(0%)',      transition: `transform ${SLIDE_MS}ms ease` });
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
      // Phase 1: rotate outgoing to 90deg
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

      // Phase 2: swap + rotate incoming from -90deg to 0
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

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft')  navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const canvasWidth  = project.canvas.width;
  const canvasHeight = project.canvas.height;

  // Click left half → prev, right half → next
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (pages.length <= 1) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    navigate(x < width / 2 ? -1 : 1);
  }, [pages.length, navigate]);

  return (
    <div ref={containerRef} className="flex-1 overflow-auto bg-canvas">
      <div className="flex flex-col items-center py-8">

        {/* Page display — click left half for prev, right half for next */}
        <div
          onClick={handleCanvasClick}
          style={{
            position: 'relative',
            overflow: 'hidden',
            cursor: pages.length > 1 && !(currentIndex === pages.length - 1) ? 'pointer' : 'default',
          }}
        >
          {showBoth && nextIndex !== null ? (
            <div style={{ position: 'relative', width: canvasWidth * scale, height: canvasHeight * scale }}>
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

        {/* Start over — shown only on last page of multi-page projects */}
        {pages.length > 1 && currentIndex === pages.length - 1 && !animating && (
          <button
            onClick={() => { setCurrentIndex(0); setAnimating(false); }}
            className="mt-4 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            ↩ Start over
          </button>
        )}

      </div>
    </div>
  );
}
