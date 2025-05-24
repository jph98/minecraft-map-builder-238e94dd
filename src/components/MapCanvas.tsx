import React, { useRef, useEffect, useState } from 'react';
import { Coordinate, MinecraftMap, ViewBounds } from '@/types/map';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface MapCanvasProps {
  map: MinecraftMap;
  selectedCoordinate?: Coordinate | null;
  onCoordinateSelect: (coordinate: Coordinate | null) => void;
  onFullScreen?: () => void;
  isFullScreen?: boolean;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  map,
  selectedCoordinate,
  onCoordinateSelect,
  onFullScreen,
  isFullScreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const getCoordinateColor = (y: number): string => {
    if (y < 0) return '#8B4513'; // Brown for underground
    if (y < 64) return '#228B22'; // Green for surface
    if (y < 128) return '#87CEEB'; // Light blue for elevated
    return '#F5F5DC'; // Beige for sky level
  };

  const calculateBounds = (): ViewBounds => {
    if (map.coordinates.length === 0) {
      return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    }

    const xs = map.coordinates.map(c => c.x);
    const zs = map.coordinates.map(c => c.z);
    
    const padding = 50;
    return {
      minX: Math.min(...xs) - padding,
      maxX: Math.max(...xs) + padding,
      minZ: Math.min(...zs) - padding,
      maxZ: Math.max(...zs) + padding,
    };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = calculateBounds();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Set transform
    ctx.save();
    ctx.translate(canvasWidth / 2 + offset.x, canvasHeight / 2 + offset.y);
    ctx.scale(scale, scale);

    // Draw grid
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 0.5;
    const gridSize = 50;
    
    for (let x = bounds.minX; x <= bounds.maxX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.minZ);
      ctx.lineTo(x, bounds.maxZ);
      ctx.stroke();
    }
    
    for (let z = bounds.minZ; z <= bounds.maxZ; z += gridSize) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, z);
      ctx.lineTo(bounds.maxX, z);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(bounds.minX, 0);
    ctx.lineTo(bounds.maxX, 0);
    ctx.stroke();
    
    // Z axis
    ctx.beginPath();
    ctx.moveTo(0, bounds.minZ);
    ctx.lineTo(0, bounds.maxZ);
    ctx.stroke();

    // Draw coordinates
    map.coordinates.forEach(coord => {
      const isSelected = selectedCoordinate?.id === coord.id;
      const color = coord.color || getCoordinateColor(coord.y);
      
      // Draw point
      ctx.fillStyle = color;
      ctx.strokeStyle = isSelected ? '#FFD700' : '#000';
      ctx.lineWidth = isSelected ? 3 : 1;
      
      ctx.beginPath();
      ctx.arc(coord.x, coord.z, isSelected ? 8 : 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(coord.label, coord.x, coord.z - 15);
      
      // Draw coordinates
      ctx.font = '10px Arial';
      ctx.fillText(`(${coord.x}, ${coord.y}, ${coord.z})`, coord.x, coord.z + 20);
    });

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Transform click coordinates to world coordinates
    const worldX = (clickX - canvas.width / 2 - offset.x) / scale;
    const worldZ = (clickY - canvas.height / 2 - offset.y) / scale;

    // Find closest coordinate
    let closestCoord: Coordinate | null = null;
    let minDistance = Infinity;

    map.coordinates.forEach(coord => {
      const distance = Math.sqrt((coord.x - worldX) ** 2 + (coord.z - worldZ) ** 2);
      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        closestCoord = coord;
      }
    });

    onCoordinateSelect(closestCoord);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));

  useEffect(() => {
    drawCanvas();
  }, [map, scale, offset, selectedCoordinate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className={`relative w-full ${isFullScreen ? 'h-full' : 'h-96'} bg-amber-50 border-2 border-amber-200 rounded-lg overflow-hidden`}>
      <canvas
        ref={canvasRef}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />
      
      <div className="absolute top-4 right-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={zoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={zoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={resetView}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        {!isFullScreen && onFullScreen && (
          <Button size="sm" variant="outline" onClick={onFullScreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
