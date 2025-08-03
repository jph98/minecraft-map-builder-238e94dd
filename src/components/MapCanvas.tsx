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
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    
    // Calculate dynamic padding based on coordinate spread
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;
    const maxRange = Math.max(rangeX, rangeZ);
    
    // Use proportional padding (minimum 50, maximum 500)
    const padding = Math.max(50, Math.min(500, maxRange * 0.1));
    
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minZ: minZ - padding,
      maxZ: maxZ + padding,
    };
  };

  // Calculate dynamic label interval based on zoom level
  const calculateLabelInterval = (bounds: ViewBounds, canvasWidth: number): number => {
    const worldWidth = bounds.maxX - bounds.minX;
    const pixelsPerUnit = (canvasWidth * scale) / worldWidth;
    
    // Minimum spacing between labels in pixels
    const minLabelSpacing = 100;
    
    // Calculate how many world units we need between labels
    const minWorldSpacing = minLabelSpacing / pixelsPerUnit;
    
    // Round up to nice intervals (powers of 2, 5, or 10)
    const intervals = [1, 2, 4, 5, 8, 10, 16, 20, 32, 40, 64, 80, 128, 160, 256, 320, 512, 640, 1024, 1280, 2048, 2560, 4096];
    
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
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate world dimensions for proper scaling
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxZ - bounds.minZ;
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterZ = (bounds.minZ + bounds.maxZ) / 2;

    // Set transform to center the world in the canvas
    ctx.save();
    ctx.translate(canvasWidth / 2 + offset.x, canvasHeight / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-worldCenterX, -worldCenterZ);

    // Draw Minecraft-style grid (like chunk boundaries)
    ctx.strokeStyle = '#4A7C59';
    ctx.lineWidth = 2 / scale; // Scale line width inversely to zoom
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
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3 / scale;
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
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 4 / scale;
    
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
    const baseLabelFontSize = Math.max(14, 18 / scale);
    const baseCoordFontSize = Math.max(12, 14 / scale);
    const baseAxisLabelFontSize = Math.max(16, 20 / scale);

    // Calculate dynamic label interval
    const labelInterval = calculateLabelInterval(bounds, canvasWidth);

    // Draw axis labels
    ctx.fillStyle = '#1A1A1A';
    ctx.font = `bold ${baseAxisLabelFontSize}px monospace`;
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let x = Math.ceil(bounds.minX / labelInterval) * labelInterval; x <= bounds.maxX; x += labelInterval) {
      if (x !== 0) {
        ctx.fillText(x.toString(), x, -20 / scale);
      }
    }
    
    // Z-axis labels
    ctx.textAlign = 'right';
    for (let z = Math.ceil(bounds.minZ / labelInterval) * labelInterval; z <= bounds.maxZ; z += labelInterval) {
      if (z !== 0) {
        ctx.fillText(z.toString(), -20 / scale, z + 8 / scale);
      }
    }
    
    // Origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', -20 / scale, -20 / scale);

    // Draw coordinates as Minecraft-style blocks with improved visibility
    map.coordinates.forEach(coord => {
      const isSelected = selectedCoordinate?.id === coord.id;
      const color = coord.color || getCoordinateColor(coord.y);
      
      // Dynamic block size based on zoom level for better visibility
      const baseBlockSize = Math.max(16, 24 / scale);
      const blockSize = isSelected ? baseBlockSize * 1.3 : baseBlockSize;
      
      // Main block
      ctx.fillStyle = color;
      ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Block outline - thicker and more visible
      ctx.strokeStyle = isSelected ? '#FFD700' : '#000';
      ctx.lineWidth = Math.max(2, 4 / scale);
      ctx.strokeRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Add highlight effect for 3D block look
      if (!isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize/2, blockSize/2);
      }

      // Draw label with dynamic sizing and better visibility
      const labelFontSize = Math.max(12, baseLabelFontSize);
      ctx.font = `bold ${labelFontSize}px monospace`;
      ctx.textAlign = 'center';
      
      // Text background - more prominent
      const textMetrics = ctx.measureText(coord.label);
      const textWidth = textMetrics.width + 16 / scale;
      const textHeight = 24 / scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(coord.x - textWidth/2, coord.z - (45 / scale), textWidth, textHeight);
      
      // Text with white outline for better visibility
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3 / scale;
      ctx.strokeText(coord.label, coord.x, coord.z - (26 / scale));
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(coord.label, coord.x, coord.z - (26 / scale));
      
      // Draw coordinates in smaller text
      const coordFontSize = Math.max(10, baseCoordFontSize);
      ctx.font = `bold ${coordFontSize}px monospace`;
      const coordText = `(${coord.x}, ${coord.y}, ${coord.z})`;
      const coordMetrics = ctx.measureText(coordText);
      const coordWidth = coordMetrics.width + 12 / scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(coord.x - coordWidth/2, coord.z + (28 / scale), coordWidth, 20 / scale);
      
      // Coordinate text with outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2 / scale;
      ctx.strokeText(coordText, coord.x, coord.z + (42 / scale));
      
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(coordText, coord.x, coord.z + (42 / scale));
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

    const bounds = calculateBounds();
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterZ = (bounds.minZ + bounds.maxZ) / 2;

    // Transform click coordinates to world coordinates
    const worldX = ((clickX - canvas.width / 2 - offset.x) / scale) + worldCenterX;
    const worldZ = ((clickY - canvas.height / 2 - offset.y) / scale) + worldCenterZ;

    // Find closest coordinate with increased detection radius
    let closestCoord: Coordinate | null = null;
    let minDistance = Infinity;

    map.coordinates.forEach(coord => {
      const distance = Math.sqrt((coord.x - worldX) ** 2 + (coord.z - worldZ) ** 2);
      const detectionRadius = Math.max(25, 35 / scale); // Dynamic detection radius
      if (distance < detectionRadius && distance < minDistance) {
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
