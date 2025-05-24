
import React, { useEffect } from 'react';
import { MapCanvas } from './MapCanvas';
import { MinecraftMap, Coordinate } from '@/types/map';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FullScreenMapProps {
  map: MinecraftMap;
  selectedCoordinate?: Coordinate | null;
  onCoordinateSelect: (coordinate: Coordinate | null) => void;
  onClose: () => void;
}

export const FullScreenMap: React.FC<FullScreenMapProps> = ({
  map,
  selectedCoordinate,
  onCoordinateSelect,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="w-full h-full p-4 relative">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="w-full h-full bg-white rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-amber-50">
            <h2 className="text-xl font-bold">{map.name}</h2>
            <p className="text-gray-600">{map.description}</p>
          </div>
          
          <div className="h-[calc(100%-80px)]">
            <MapCanvas
              map={map}
              selectedCoordinate={selectedCoordinate}
              onCoordinateSelect={onCoordinateSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
