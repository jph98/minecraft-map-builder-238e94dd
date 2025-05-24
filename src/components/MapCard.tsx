
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MinecraftMap } from '@/types/map';
import { Trash2 } from 'lucide-react';

interface MapCardProps {
  map: MinecraftMap;
  onSelect: (map: MinecraftMap) => void;
  onDelete: (mapId: string) => void;
  isSelected: boolean;
}

export const MapCard: React.FC<MapCardProps> = ({ map, onSelect, onDelete, isSelected }) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50' : ''}`}>
      <CardHeader className="pb-3" onClick={() => onSelect(map)}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{map.name}</CardTitle>
            <CardDescription className="mt-1">{map.description}</CardDescription>
          </div>
          <Badge variant="secondary">
            {map.coordinates.length} coords
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0" onClick={() => onSelect(map)}>
        <div className="text-sm text-gray-600">
          Created: {map.createdAt.toLocaleDateString()}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(map.id);
          }}
          className="ml-auto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
