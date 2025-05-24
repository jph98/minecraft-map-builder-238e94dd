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
      ctx.lineTo(bounds.maxX, z);
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

    // Draw axis labels in Minecraft font style
    ctx.fillStyle = '#1A1A1A'; // Dark text like Minecraft UI
    ctx.font = 'bold 12px monospace'; // Monospace font for pixelated look
    ctx.textAlign = 'center';
    
    // X-axis labels
    const labelStep = majorGridSize; // Label every 64 units
    for (let x = Math.ceil(bounds.minX / labelStep) * labelStep; x <= bounds.maxX; x += labelStep) {
      if (x !== 0) {
        ctx.fillText(x.toString(), x, -8);
      }
    }
    
    // Z-axis labels
    ctx.textAlign = 'right';
    for (let z = Math.ceil(bounds.minZ / labelStep) * labelStep; z <= bounds.maxZ; z += labelStep) {
      if (z !== 0) {
        ctx.fillText(z.toString(), -8, z + 4);
      }
    }
    
    // Origin label
    ctx.textAlign = 'right';
    ctx.fillText('0', -8, -8);

    // Draw coordinates as Minecraft-style blocks
    map.coordinates.forEach(coord => {
      const isSelected = selectedCoordinate?.id === coord.id;
      const color = coord.color || getCoordinateColor(coord.y);
      
      // Draw block-style coordinate point
      const blockSize = isSelected ? 12 : 8;
      
      // Main block
      ctx.fillStyle = color;
      ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Block outline (Minecraft block style)
      ctx.strokeStyle = isSelected ? '#FFD700' : '#000'; // Gold for selected
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize, blockSize);
      
      // Add highlight effect for 3D block look
      if (!isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(coord.x - blockSize/2, coord.z - blockSize/2, blockSize/2, blockSize/2);
      }

      // Draw label with Minecraft-style background
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      
      // Text background (like Minecraft name tags)
      const textMetrics = ctx.measureText(coord.label);
      const textWidth = textMetrics.width + 6;
      const textHeight = 14;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(coord.x - textWidth/2, coord.z - 25, textWidth, textHeight);
      
      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(coord.label, coord.x, coord.z - 16);
      
      // Draw coordinates in smaller text
      ctx.font = 'bold 9px monospace';
      const coordText = `(${coord.x}, ${coord.y}, ${coord.z})`;
      const coordMetrics = ctx.measureText(coordText);
      const coordWidth = coordMetrics.width + 4;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(coord.x - coordWidth/2, coord.z + 15, coordWidth, 12);
      
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(coordText, coord.x, coord.z + 24);
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
    <div className={`relative w-full ${isFullScreen ? 'h-full' : 'h-96'} bg-green-600 border-4 border-green-800 rounded-lg overflow-hidden shadow-lg`}>
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
