
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MinecraftMap } from '@/types/map';
import { Trash2, Edit } from 'lucide-react';

interface MapCardProps {
  map: MinecraftMap;
  onSelect: (map: MinecraftMap) => void;
  onDelete: (mapId: string) => void;
  onEdit: (map: MinecraftMap) => void;
  isSelected: boolean;
}

export const MapCard: React.FC<MapCardProps> = ({ map, onSelect, onDelete, onEdit, isSelected }) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50' : ''}`}>
      <CardHeader className="pb-3" onClick={() => onSelect(map)}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{map.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{map.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {map.coordinates.length} coords
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0" onClick={() => onSelect(map)}>
        <div className="text-sm text-gray-600">
          Created: {map.createdAt.toLocaleDateString()}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(map);
          }}
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(map.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
