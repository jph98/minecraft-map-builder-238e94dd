
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MinecraftMap } from '@/types/map';
import { Edit } from 'lucide-react';

interface MapEditDialogProps {
  map: MinecraftMap;
  onUpdateMap: (mapId: string, updates: { name: string; description: string }) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MapEditDialog: React.FC<MapEditDialogProps> = ({ 
  map, 
  onUpdateMap, 
  isOpen, 
  onOpenChange 
}) => {
  const [formData, setFormData] = useState({
    name: map.name,
    description: map.description,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    onUpdateMap(map.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
    });

    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Map
          </DialogTitle>
          <DialogDescription>
            Update your map's name and description.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Map Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Awesome World"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A detailed map of my Minecraft world with all important locations..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Map</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
