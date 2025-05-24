
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coordinate } from '@/types/map';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface BulkCoordinateImportProps {
  onImportCoordinates: (coordinates: Omit<Coordinate, 'id'>[]) => void;
}

export const BulkCoordinateImport: React.FC<BulkCoordinateImportProps> = ({ onImportCoordinates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

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

  const handleImport = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some coordinates to import');
      return;
    }

    const coordinates = parseCoordinates(textInput);
    
    if (coordinates.length === 0) {
      toast.error('No valid coordinates found. Format: label, x, y, z (one per line)');
      return;
    }

    onImportCoordinates(coordinates);
    toast.success(`Imported ${coordinates.length} coordinate${coordinates.length > 1 ? 's' : ''}`);
    setTextInput('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Multi Add Coordinates
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Multi Add Coordinates
          </DialogTitle>
          <DialogDescription>
            Enter multiple coordinates in the format: label, x, y, z (one per line)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="coordinates">Coordinates</Label>
            <Textarea
              id="coordinates"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Home Base, 100, 64, 200&#10;Mine Entrance, -50, 70, 150&#10;Spawn Point, 0, 80, 0"
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Format:</strong> label, x, y, z<br />
            <strong>Example:</strong><br />
            Home Base, 100, 64, 200<br />
            Mine Entrance, -50, 70, 150
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleImport}>
            Add Coordinates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
