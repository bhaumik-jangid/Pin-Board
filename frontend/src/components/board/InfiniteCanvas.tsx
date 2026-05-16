import {
  useRef, useState, useCallback, useEffect,
  type ReactNode, type WheelEvent, type MouseEvent,
} from 'react';
import { useBoardStore } from '@/stores/board.store';

interface Viewport { x: number; y: number; zoom: number; }

interface Props {
  children: ReactNode;
  onViewportChange?: (vp: Viewport) => void;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

export function InfiniteCanvas({ children, onViewportChange }: Props) {
  const { isLocked } = useBoardStore();

  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const isPanning   = useRef(false);
  const lastMouse   = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateVp = useCallback((next: Viewport) => {
    setVp(next);
    onViewportChange?.(next);
  }, [onViewportChange]);

  /* ── Mouse pan ── */
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (isLocked) return;
    /* Only pan on middle-button or when clicking empty canvas */
    if (e.button !== 1 && (e.target as HTMLElement).closest('[data-note]')) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, [isLocked]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setVp((prev) => {
      const next = { ...prev, x: prev.x + dx, y: prev.y + dy };
      onViewportChange?.(next);
      return next;
    });
  }, [onViewportChange]);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  /* ── Wheel zoom + trackpad pan ── */
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    /* Trackpad: two-finger scroll = pan (deltaMode 0, small deltas) */
    if (!e.ctrlKey && Math.abs(e.deltaY) < 50) {
      if (isLocked) return;
      setVp((prev) => {
        const next = { ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY };
        onViewportChange?.(next);
        return next;
      });
      return;
    }

    /* Pinch or ctrl+wheel = zoom toward cursor */
    const rect    = containerRef.current!.getBoundingClientRect();
    const mouseX  = e.clientX - rect.left;
    const mouseY  = e.clientY - rect.top;

    setVp((prev) => {
      const factor = e.ctrlKey
        ? 1 - e.deltaY * 0.01          /* pinch gesture */
        : e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;

      const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev.zoom * factor));
      const scale    = nextZoom / prev.zoom;

      /* Zoom toward mouse position */
      const nextX = mouseX - scale * (mouseX - prev.x);
      const nextY = mouseY - scale * (mouseY - prev.y);

      const next = { x: nextX, y: nextY, zoom: nextZoom };
      onViewportChange?.(next);
      return next;
    });
  }, [isLocked, onViewportChange]);

  /* Prevent native browser zoom */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: Event) => e.preventDefault();
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        cursor: isLocked
          ? 'default'
          : isPanning.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Transform layer */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {/* Infinite dot-grid background — classic Miro/Figma feel */}
        <svg
          style={{
            position: 'absolute',
            inset: '-2000px',
            width: 'calc(100% + 4000px)',
            height: 'calc(100% + 4000px)',
            pointerEvents: 'none',
            opacity: 0.18,
          }}
        >
          <defs>
            <pattern
              id="dotgrid"
              x="0" y="0"
              width="32" height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="rgba(90,62,27,0.8)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* Board content */}
        {children}
      </div>
    </div>
  );
}
