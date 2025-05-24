
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      <div className="w-full h-full p-2 relative">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-stone-200 border-stone-400 hover:bg-stone-300"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="w-full h-full bg-stone-100 border-4 border-stone-600 rounded-lg overflow-hidden shadow-2xl">
          <div className="p-3 border-b-4 border-stone-600 bg-gradient-to-r from-green-400 to-green-500">
            <h2 className="text-lg font-bold text-white drop-shadow-lg" style={{ fontFamily: 'monospace' }}>{map.name}</h2>
            <p className="text-sm text-green-100 drop-shadow" style={{ fontFamily: 'monospace' }}>{map.description}</p>
          </div>
          
          <div className="h-[calc(100%-60px)]">
            <MapCanvas
              map={map}
              selectedCoordinate={selectedCoordinate}
              onCoordinateSelect={onCoordinateSelect}
              isFullScreen={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
