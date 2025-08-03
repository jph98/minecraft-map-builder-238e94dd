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
    if (y < 0) return '#654321'; // Dark brown for underground/caves
    if (y < 64) return '#228B22'; // Forest green for surface
    if (y < 128) return '#87CEEB'; // Sky blue for elevated
    return '#F0F8FF'; // Alice blue for sky level
  };

  const calculateBounds = (): ViewBounds => {
    if (map.coordinates.length === 0) {
      return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    }

    const xs = map.coordinates.map(c => c.x);
    const zs = map.coordinates.map(c => c.z);
    
    const padding = 100; // Increased padding for better visibility
    return {
      minX: Math.min(...xs) - padding,
      maxX: Math.max(...xs) + padding,
      minZ: Math.min(...zs) - padding,
      maxZ: Math.max(...zs) + padding,
    };
  };

  // Calculate dynamic label interval based on zoom level
  const calculateLabelInterval = (bounds: ViewBounds, canvasWidth: number): number => {
    const worldWidth = bounds.maxX - bounds.minX;
    const pixelsPerUnit = (canvasWidth * scale) / worldWidth;
    
    // Minimum spacing between labels in pixels
    const minLabelSpacing = 100; // Increased for better readability
    
    // Calculate how many world units we need between labels
    const minWorldSpacing = minLabelSpacing / pixelsPerUnit;
    
    // Round up to nice intervals (powers of 2 or 5)
    const intervals = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
    
    for (const interval of intervals) {
      if (interval >= minWorldSpacing) {
        return interval;
      }
    }
    
    // Fallback for very large scales
    return Math.ceil(minWorldSpacing / 1000) * 1000;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = calculateBounds();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas with Minecraft grass-like background
    ctx.fillStyle = '#7CB342'; // Minecraft grass green
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set transform
    ctx.save();
    ctx.translate(canvasWidth / 2 + offset.x, canvasHeight / 2 + offset.y);
    ctx.scale(scale, scale);

    // Draw Minecraft-style grid (like chunk boundaries)
    ctx.strokeStyle = '#4A7C59'; // Darker green for grid lines
    ctx.lineWidth = 1;
    const gridSize = 16; // Minecraft chunk size
    
    // Draw minor grid (chunks)
    for (let x = Math.floor(bounds.minX / gridSize) * gridSize; x <= bounds.maxX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.minZ);
      ctx.lineTo(x, bounds.maxZ);
      ctx.stroke();
    }
    
    for (let z = Math.floor(bounds.minZ / gridSize) * gridSize; z <= bounds.maxZ; z += gridSize) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, z);
      ctx.lineTo(bounds.maxX, z);
      ctx.stroke();
    }

    // Draw major grid (every 4 chunks = 64 blocks)
    ctx.strokeStyle = '#2E7D32'; // Even darker green for major grid
    ctx.lineWidth = 2;
    const majorGridSize = 64;
    
    for (let x = Math.floor(bounds.minX / majorGridSize) * majorGridSize; x <= bounds.maxX; x += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.minZ);
      ctx.lineTo(x, bounds.maxZ);
      ctx.stroke();
    }
    
    for (let z = Math.floor(bounds.minZ / majorGridSize) * majorGridSize; z <= bounds.maxZ; z += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, z);
      ctx.lineTo(bounds.maxZ, z);
      ctx.stroke();
    }

    // Draw axes in Minecraft bedrock color
    ctx.strokeStyle = '#2C2C2C'; // Dark gray like bedrock
    ctx.lineWidth = 3;
    
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

    // Calculate dynamic font sizes based on zoom level
    const baseLabelFontSize = Math.max(14, 18 / scale); // Increased for better visibility
    const baseCoordFontSize = Math.max(12, 14 / scale); // Increased for better visibility
    const baseAxisLabelFontSize = Math.max(16, 18 / scale); // Increased for better visibility

    // Calculate dynamic label interval to prevent overlap
    const labelInterval = calculateLabelInterval(bounds, canvasWidth);

    // Draw axis labels in Minecraft font style with dynamic sizing and intervals
    ctx.fillStyle = '#1A1A1A'; // Dark text like Minecraft UI
    ctx.font = `bold ${baseAxisLabelFontSize}px monospace`;
    ctx.textAlign = 'center';
    
    // X-axis labels with dynamic interval
    for (let x = Math.ceil(bounds.minX / labelInterval) * labelInterval; x <= bounds.maxX; x += labelInterval) {
      if (x !== 0) {
        ctx.fillText(x.toString(), x, -15 / scale); // Increased offset for better visibility
      }
    }
    
    // Z-axis labels with dynamic interval
    ctx.textAlign = 'right';
    for (let z = Math.ceil(bounds.minZ / labelInterval) * labelInterval; z <= bounds.maxZ; z += labelInterval) {
      if (z !== 0) {
        ctx.fillText(z.toString(), -15 / scale, z + 8 / scale); // Increased offset for better visibility
      }
    }
    
    // Origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', -15 / scale, -15 / scale);

    // Draw coordinates as Minecraft-style blocks with improved visibility
    map.coordinates.forEach(coord => {
      const isSelected = selectedCoordinate?.id === coord.id;
      const color = coord.color || getCoordinateColor(coord.y);
      
      // Increased block size for better visibility
      const blockSize = isSelected ? 24 : 20; // Increased from 18/14
      
      // Main block
      ctx.fillStyle = color;
      ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Block outline (Minecraft block style) - thicker outline
      ctx.strokeStyle = isSelected ? '#FFD700' : '#000'; // Gold for selected
      ctx.lineWidth = isSelected ? 4 : 3; // Increased line width
      ctx.strokeRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Add highlight effect for 3D block look
      if (!isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Increased opacity
        ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize/2, blockSize/2);
      }

      // Draw label with Minecraft-style background using dynamic font sizing
      ctx.font = `bold ${baseLabelFontSize}px monospace`;
      ctx.textAlign = 'center';
      
      // Text background (like Minecraft name tags) with dynamic sizing
      const textMetrics = ctx.measureText(coord.label);
      const textWidth = textMetrics.width + 12 / scale; // Increased padding
      const textHeight = 22 / scale; // Increased height
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; // Increased opacity
      ctx.fillRect(coord.x - textWidth/2, coord.z - 38 / scale, textWidth, textHeight); // Increased offset
      
      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(coord.label, coord.x, coord.z - 22 / scale); // Adjusted offset
      
      // Draw coordinates in smaller text with dynamic sizing
      ctx.font = `bold ${baseCoordFontSize}px monospace`;
      const coordText = `(${coord.x}, ${coord.y}, ${coord.z})`;
      const coordMetrics = ctx.measureText(coordText);
      const coordWidth = coordMetrics.width + 8 / scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Increased opacity
      ctx.fillRect(coord.x - coordWidth/2, coord.z + 26 / scale, coordWidth, 18 / scale); // Adjusted positions
      
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(coordText, coord.x, coord.z + 38 / scale); // Adjusted offset
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

    // Find closest coordinate (increased detection radius for better UX)
    let closestCoord: Coordinate | null = null;
    let minDistance = Infinity;

    map.coordinates.forEach(coord => {
      const distance = Math.sqrt((coord.x - worldX) ** 2 + (coord.z - worldZ) ** 2);
      if (distance < 30 && distance < minDistance) { // Increased from 25 to 30
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
    <div className={`relative w-full ${isFullScreen ? 'h-full' : 'min-h-[800px]'} bg-green-600 border-4 border-green-800 rounded-lg overflow-hidden shadow-lg`}>
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
        <Button size="sm" variant="outline" onClick={zoomIn} className="bg-stone-200 border-stone-400 hover:bg-stone-300">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={zoomOut} className="bg-stone-200 border-stone-400 hover:bg-stone-300">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={resetView} className="bg-stone-200 border-stone-400 hover:bg-stone-300">
          <RotateCcw className="w-4 h-4" />
        </Button>
        {!isFullScreen && onFullScreen && (
          <Button size="sm" variant="outline" onClick={onFullScreen} className="bg-stone-200 border-stone-400 hover:bg-stone-300">
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
