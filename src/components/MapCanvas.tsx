import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Coordinate, MinecraftMap, ViewBounds } from '@/types/map';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Tags } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapCanvasProps {
  map: MinecraftMap;
  selectedCoordinate?: Coordinate | null;
  onCoordinateSelect: (coordinate: Coordinate | null) => void;
  onFullScreen?: () => void;
  isFullScreen?: boolean;
  /** When true, clicking/tapping the map picks a spot instead of selecting a marker. */
  placeMode?: boolean;
  onPlacePoint?: (x: number, z: number) => void;
}

type Rect = { x: number; y: number; w: number; h: number };

const rectsOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const MapCanvas: React.FC<MapCanvasProps> = ({
  map,
  selectedCoordinate,
  onCoordinateSelect,
  onFullScreen,
  isFullScreen = false,
  placeMode = false,
  onPlacePoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [hiddenLabels, setHiddenLabels] = useState(0);
  const isMobile = useIsMobile();

  // Touch state
  const touchState = useRef<{ mode: 'none' | 'pan' | 'pinch'; x: number; y: number; dist: number; scale: number }>({
    mode: 'none', x: 0, y: 0, dist: 0, scale: 1,
  });
  const lastTap = useRef(0);

  const getCoordinateColor = (y: number): string => {
    if (y < 0) return '#654321';
    if (y < 64) return '#228B22';
    if (y < 128) return '#87CEEB';
    return '#F0F8FF';
  };

  const calculateBounds = useCallback((): ViewBounds => {
    if (map.coordinates.length === 0) {
      return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    }

    const xs = map.coordinates.map(c => c.x);
    const zs = map.coordinates.map(c => c.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const maxRange = Math.max(maxX - minX, maxZ - minZ);
    const padding = Math.max(120, Math.min(1000, maxRange * 0.15));

    return { minX: minX - padding, maxX: maxX + padding, minZ: minZ - padding, maxZ: maxZ + padding };
  }, [map.coordinates]);

  // Camera in CSS pixels
  const getCamera = useCallback((cssWidth: number, cssHeight: number) => {
    const bounds = calculateBounds();
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxZ - bounds.minZ;
    const fit = Math.min((cssWidth * 0.9) / worldWidth, (cssHeight * 0.9) / worldHeight);
    const autoScale = fit * scale;
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterZ = (bounds.minZ + bounds.maxZ) / 2;

    const toScreen = (x: number, z: number) => ({
      x: cssWidth / 2 + offset.x + (x - worldCenterX) * autoScale,
      y: cssHeight / 2 + offset.y + (z - worldCenterZ) * autoScale,
    });
    const toWorld = (sx: number, sy: number) => ({
      x: (sx - cssWidth / 2 - offset.x) / autoScale + worldCenterX,
      z: (sy - cssHeight / 2 - offset.y) / autoScale + worldCenterZ,
    });

    return { bounds, autoScale, worldCenterX, worldCenterZ, toScreen, toWorld };
  }, [calculateBounds, scale, offset]);

  const niceInterval = (minWorldSpacing: number) => {
    const intervals = [1, 2, 4, 5, 8, 10, 16, 20, 32, 40, 64, 80, 128, 160, 256, 320, 512, 640, 1024, 1280, 2048, 2560, 4096, 8192, 16384];
    return intervals.find(i => i >= minWorldSpacing) ?? Math.ceil(minWorldSpacing / 1000) * 1000;
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) return;

    if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const { bounds, autoScale, toScreen } = getCamera(cssWidth, cssHeight);

    // Background
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // ---- Layer 1: grid (screen-space line widths, world-spaced) ----
    const minorSpacingPx = 26;
    const minorStep = niceInterval(minorSpacingPx / autoScale);
    const majorStep = minorStep * 4;

    const drawGrid = (step: number, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
        const p = toScreen(x, bounds.minZ);
        const q = toScreen(x, bounds.maxZ);
        ctx.moveTo(Math.round(p.x) + 0.5, p.y);
        ctx.lineTo(Math.round(q.x) + 0.5, q.y);
      }
      for (let z = Math.floor(bounds.minZ / step) * step; z <= bounds.maxZ; z += step) {
        const p = toScreen(bounds.minX, z);
        const q = toScreen(bounds.maxX, z);
        ctx.moveTo(p.x, Math.round(p.y) + 0.5);
        ctx.lineTo(q.x, Math.round(q.y) + 0.5);
      }
      ctx.stroke();
    };

    drawGrid(minorStep, 'rgba(74, 124, 89, 0.55)', 1);
    drawGrid(majorStep, 'rgba(46, 125, 50, 0.9)', 1.5);

    // ---- Layer 2: axes ----
    const origin = toScreen(0, 0);
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(origin.y) + 0.5);
    ctx.lineTo(cssWidth, Math.round(origin.y) + 0.5);
    ctx.moveTo(Math.round(origin.x) + 0.5, 0);
    ctx.lineTo(Math.round(origin.x) + 0.5, cssHeight);
    ctx.stroke();

    // ---- Layer 3: axis rulers pinned to the viewport edges ----
    const axisFont = isMobile ? 10 : 12;
    ctx.font = `bold ${axisFont}px ui-monospace, monospace`;
    const labelStep = niceInterval((isMobile ? 64 : 90) / autoScale);

    const rulerRects: Rect[] = [];
    const rulerY = Math.min(Math.max(origin.y, 16), cssHeight - 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = Math.ceil(bounds.minX / labelStep) * labelStep; x <= bounds.maxX; x += labelStep) {
      const sx = toScreen(x, 0).x;
      if (sx < 18 || sx > cssWidth - 18) continue;
      const text = String(x);
      const w = ctx.measureText(text).width + 6;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(sx - w / 2, rulerY - 15, w, 14);
      ctx.fillStyle = '#1A1A1A';
      ctx.fillText(text, sx, rulerY - 8);
      rulerRects.push({ x: sx - w / 2, y: rulerY - 15, w, h: 14 });
    }

    const rulerX = Math.min(Math.max(origin.x, 6), cssWidth - 6);
    ctx.textAlign = 'right';
    for (let z = Math.ceil(bounds.minZ / labelStep) * labelStep; z <= bounds.maxZ; z += labelStep) {
      const sy = toScreen(0, z).y;
      if (sy < 14 || sy > cssHeight - 14) continue;
      const text = String(z);
      const w = ctx.measureText(text).width + 6;
      const right = Math.max(w + 4, rulerX - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(right - w, sy - 7, w, 14);
      ctx.fillStyle = '#1A1A1A';
      ctx.fillText(text, right - 3, sy);
      rulerRects.push({ x: right - w, y: sy - 7, w, h: 14 });
    }

    // ---- Layer 4: markers (fixed screen size, never overlap-scaled) ----
    const markerSize = isMobile ? 12 : 16;
    const visible = map.coordinates
      .map(c => ({ coord: c, p: toScreen(c.x, c.z) }))
      .filter(({ p }) => p.x > -60 && p.x < cssWidth + 60 && p.y > -60 && p.y < cssHeight + 60);

    visible.forEach(({ coord, p }) => {
      const isSelected = selectedCoordinate?.id === coord.id;
      const size = isSelected ? markerSize * 1.5 : markerSize;
      ctx.fillStyle = coord.color || getCoordinateColor(coord.y);
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.strokeStyle = isSelected ? '#FFD700' : '#111';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size / 3, size / 3);
    });

    // ---- Layer 5: labels with collision avoidance ----
    let skipped = 0;
    if (showLabels) {
      const labelFont = isMobile ? 11 : 13;
      const coordFont = isMobile ? 9 : 11;
      const lineH = labelFont + 6;
      const showCoordText = !isMobile && scale >= 1.5;

      // Selected label wins; then draw in reading order
      const ordered = [...visible].sort((a, b) => {
        const aSel = selectedCoordinate?.id === a.coord.id ? 0 : 1;
        const bSel = selectedCoordinate?.id === b.coord.id ? 0 : 1;
        return aSel - bSel || a.p.y - b.p.y || a.p.x - b.p.x;
      });

      const placed: Rect[] = [
        ...rulerRects,
        // keep labels clear of the floating control bar
        { x: cssWidth - (isMobile ? 210 : 250), y: 0, w: isMobile ? 210 : 250, h: 52 },
        ...visible.map(({ p }) => ({
          x: p.x - markerSize, y: p.y - markerSize, w: markerSize * 2, h: markerSize * 2,
        })),
      ];

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      ordered.forEach(({ coord, p }) => {
        const isSelected = selectedCoordinate?.id === coord.id;
        ctx.font = `bold ${labelFont}px ui-monospace, monospace`;
        const maxChars = isMobile ? 16 : 26;
        const text = coord.label.length > maxChars ? `${coord.label.slice(0, maxChars - 1)}…` : coord.label;
        const textW = ctx.measureText(text).width + 10;

        let coordText = '';
        let coordW = 0;
        if (showCoordText || isSelected) {
          ctx.font = `bold ${coordFont}px ui-monospace, monospace`;
          coordText = `(${coord.x}, ${coord.y}, ${coord.z})`;
          coordW = ctx.measureText(coordText).width + 8;
        }

        const boxW = Math.max(textW, coordW);
        const boxH = lineH + (coordText ? coordFont + 4 : 0);

        // Candidate placements: above, below, right, left
        const candidates: Rect[] = [
          { x: p.x - boxW / 2, y: p.y - markerSize - 4 - boxH, w: boxW, h: boxH },
          { x: p.x - boxW / 2, y: p.y + markerSize + 4, w: boxW, h: boxH },
          { x: p.x + markerSize + 4, y: p.y - boxH / 2, w: boxW, h: boxH },
          { x: p.x - markerSize - 4 - boxW, y: p.y - boxH / 2, w: boxW, h: boxH },
        ];

        const spot = candidates.find(
          c =>
            c.x > 2 && c.y > 2 && c.x + c.w < cssWidth - 2 && c.y + c.h < cssHeight - 2 &&
            !placed.some(r => rectsOverlap(r, c)),
        );

        if (!spot) {
          if (!isSelected) { skipped++; return; }
        }

        const box = spot ?? candidates[0];
        placed.push(box);

        ctx.fillStyle = isSelected ? 'rgba(20,20,20,0.95)' : 'rgba(0,0,0,0.78)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        if (isSelected) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.w, box.h);
        }

        ctx.font = `bold ${labelFont}px ui-monospace, monospace`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, box.x + box.w / 2, box.y + lineH / 2);

        if (coordText) {
          ctx.font = `bold ${coordFont}px ui-monospace, monospace`;
          ctx.fillStyle = '#CFCFCF';
          ctx.fillText(coordText, box.x + box.w / 2, box.y + lineH + (coordFont + 4) / 2 - 1);
        }
      });
    }
    setHiddenLabels(skipped);
  }, [getCamera, map.coordinates, selectedCoordinate, isMobile, showLabels, scale]);

  const selectAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const { toScreen, toWorld } = getCamera(canvas.clientWidth, canvas.clientHeight);

    if (placeMode && onPlacePoint) {
      const world = toWorld(sx, sy);
      onPlacePoint(Math.round(world.x), Math.round(world.z));
      return;
    }

    let closest: Coordinate | null = null;
    let minDistance = Infinity;
    const radius = isMobile ? 28 : 20;


    map.coordinates.forEach(coord => {
      const p = toScreen(coord.x, coord.z);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < radius && d < minDistance) {
        minDistance = d;
        closest = coord;
      }
    });

    onCoordinateSelect(closest);
  };

  // Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset(prev => ({ x: prev.x + e.clientX - lastMouse.x, y: prev.y + e.clientY - lastMouse.y }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleCanvasClick = (e: React.MouseEvent) => selectAt(e.clientX, e.clientY);
  const handleCanvasDoubleClick = () => setScale(prev => Math.min(prev * 1.4, 8));

  // Touch: 1 finger pan / tap, 2 finger pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchState.current = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0, scale };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      touchState.current = { mode: 'pinch', x: 0, y: 0, dist, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const st = touchState.current;
    if (st.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        st.x = e.touches[0].clientX;
        st.y = e.touches[0].clientY;
        st.dist = 1; // mark as moved
      }
    } else if (st.mode === 'pinch' && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (st.dist > 0) setScale(Math.min(Math.max(st.scale * (dist / st.dist), 0.1), 8));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const st = touchState.current;
    if (st.mode === 'pan' && st.dist === 0 && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const now = Date.now();
      if (now - lastTap.current < 300) {
        setScale(prev => Math.min(prev * 1.4, 8));
      } else {
        selectAt(t.clientX, t.clientY);
      }
      lastTap.current = now;
    }
    touchState.current = { mode: 'none', x: 0, y: 0, dist: 0, scale };
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };
  const zoomIn = () => setScale(prev => Math.min(prev * 1.3, 8));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.3, 0.1));

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => drawCanvas());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawCanvas]);

  return (
    <div
      className={`relative w-full ${isFullScreen ? 'h-full' : 'min-h-[380px] h-[60vh] sm:h-auto sm:min-h-[800px]'} bg-green-600 border-2 sm:border-4 border-green-800 rounded-lg overflow-hidden shadow-lg`}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none ${placeMode ? 'cursor-crosshair' : 'cursor-move'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-2">
        <Button size="icon" variant="outline" onClick={() => setShowLabels(v => !v)} aria-label="Toggle labels" className={`h-9 w-9 border-stone-400 ${showLabels ? 'bg-stone-200 hover:bg-stone-300' : 'bg-stone-400 hover:bg-stone-500'}`}>
          <Tags className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={zoomIn} aria-label="Zoom in" className="h-9 w-9 bg-stone-200 border-stone-400 hover:bg-stone-300">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={zoomOut} aria-label="Zoom out" className="h-9 w-9 bg-stone-200 border-stone-400 hover:bg-stone-300">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={resetView} aria-label="Reset view" className="h-9 w-9 bg-stone-200 border-stone-400 hover:bg-stone-300">
          <RotateCcw className="w-4 h-4" />
        </Button>
        {!isFullScreen && onFullScreen && (
          <Button size="icon" variant="outline" onClick={onFullScreen} aria-label="Full screen" className="h-9 w-9 bg-stone-200 border-stone-400 hover:bg-stone-300">
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {placeMode && (
        <div className="absolute top-2 left-2 rounded bg-black/75 px-2 py-1 text-[11px] font-mono text-white sm:text-xs">
          Tap the map to place a new location
        </div>
      )}

      {showLabels && hiddenLabels > 0 && (
        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[11px] font-mono text-white">
          {hiddenLabels} label{hiddenLabels > 1 ? 's' : ''} hidden — zoom in to reveal
        </div>
      )}
    </div>
  );
};
