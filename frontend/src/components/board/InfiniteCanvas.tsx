import {
  useRef, useCallback, useEffect,
  type ReactNode, type WheelEvent, type MouseEvent,
} from 'react';
import { useBoardStore } from '@/stores/board.store';

export interface Viewport { x: number; y: number; zoom: number; }

interface Props {
  children:           ReactNode;
  viewport:           Viewport;                /* always controlled from BoardPage */
  onViewportChange:   (vp: Viewport) => void;
}

const ZOOM_MIN  = 0.20;
const ZOOM_MAX  = 3.0;
const ZOOM_STEP = 0.08;

export function InfiniteCanvas({ children, viewport, onViewportChange }: Props) {
  const { isLocked } = useBoardStore();

  const isPanning    = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Mouse pan — locked board = no pan ── */
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (isLocked) return;
    /* Don't pan when clicking a note or its children */
    if ((e.target as HTMLElement).closest('.note-drag-handle,[data-rbd-drag-handle-draggable-id]')) return;
    if (e.button !== 0) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [isLocked]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    onViewportChange({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
  }, [viewport, onViewportChange]);

  const stopPan = useCallback(() => { isPanning.current = false; }, []);

  /* ── Wheel — ALL gated by lock ── */
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    /*
      LOCKED = zero interaction.
      This makes the pin mechanic the ONLY way to interact
      with the canvas spatially. Without pins removed, the
      board is completely fixed — zoom, pan, everything.
    */
    if (isLocked) return;

    const isZoomGesture = e.ctrlKey || e.metaKey;

    if (!isZoomGesture && Math.abs(e.deltaX) + Math.abs(e.deltaY) < 60) {
      /* Trackpad two-finger scroll = pan */
      onViewportChange({
        ...viewport,
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY,
      });
      return;
    }

    /* Pinch or scroll = zoom toward cursor */
    const rect    = containerRef.current!.getBoundingClientRect();
    const mx      = e.clientX - rect.left;
    const my      = e.clientY - rect.top;

    const rawFactor = isZoomGesture
      ? 1 - e.deltaY * 0.01
      : e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;

    const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.zoom * rawFactor));
    const scale    = nextZoom / viewport.zoom;

    onViewportChange({
      x: mx - scale * (mx - viewport.x),
      y: my - scale * (my - viewport.y),
      zoom: nextZoom,
    });
  }, [isLocked, viewport, onViewportChange]);

  /* Block native browser scroll/zoom on canvas element */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener('wheel', block, { passive: false });
    return () => el.removeEventListener('wheel', block);
  }, []);

  const cursor = isLocked
    ? 'default'
    : isPanning.current ? 'grabbing' : 'grab';

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
