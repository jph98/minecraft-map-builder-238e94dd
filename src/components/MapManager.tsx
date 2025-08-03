
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MinecraftMap, Coordinate } from '@/types/map';
import { Plus } from 'lucide-react';

interface MapManagerProps {
  onCreateMap: (map: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>, coordinates: Omit<Coordinate, 'id'>[]) => void;
}

export const MapManager: React.FC<MapManagerProps> = ({ onCreateMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coordinates: '',
  });

  const parseCoordinates = (text: string): Omit<Coordinate, 'id'>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const coordinates: Omit<Coordinate, 'id'>[] = [];
    
    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length >= 4) {
        const label = parts[0].trim();
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        const z = parseInt(parts[3]);
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && label) {
          coordinates.push({ x, y, z, label });
        }
      }
    }
    
    return coordinates;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const coordinates = parseCoordinates(formData.coordinates);

    onCreateMap({
      name: formData.name.trim(),
      description: formData.description.trim(),
    }, coordinates);

    setFormData({ name: '', description: '', coordinates: '' });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="minecraft-button bg-green-600 border-green-800 text-white hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Map
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Map</DialogTitle>
          <DialogDescription>
            Give your map a name, description, and optionally add initial coordinates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Map Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Awesome World"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A detailed map of my Minecraft world with all important locations..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="coordinates">Initial Coordinates (Optional)</Label>
              <Textarea
                id="coordinates"
                value={formData.coordinates}
                onChange={(e) => handleInputChange('coordinates', e.target.value)}
                placeholder="Home Base, 100, 64, 200&#10;Mine Entrance, -50, 70, 150&#10;Spawn Point, 0, 80, 0"
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-2">
                <strong>Format:</strong> label, x, y, z (one per line)<br />
                <strong>Example:</strong><br />
                Home Base, 100, 64, 200<br />
                Mine Entrance, -50, 70, 150
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Map</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
