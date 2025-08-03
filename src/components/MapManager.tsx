
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MinecraftMap, Coordinate } from '@/types/map';
import { Plus, AlertTriangle } from 'lucide-react';

interface MapManagerProps {
  onCreateMap: (map: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>, coordinates: Omit<Coordinate, 'id'>[]) => void;
}

interface ParseWarning {
  line: string;
  issue: string;
}

export const MapManager: React.FC<MapManagerProps> = ({ onCreateMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coordinates: '',
  });
  const [parseWarnings, setParseWarnings] = useState<ParseWarning[]>([]);

  const parseCoordinates = (text: string): { coordinates: Omit<Coordinate, 'id'>[], warnings: ParseWarning[] } => {
    if (!text.trim()) return { coordinates: [], warnings: [] };
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    const coordinates: Omit<Coordinate, 'id'>[] = [];
    const warnings: ParseWarning[] = [];
    
    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length < 4) {
        warnings.push({ line, issue: 'Missing coordinates (needs label, x, y, z)' });
        continue;
      }
      
      const label = parts[0].trim();
      const x = parseInt(parts[1]);
      const y = parseInt(parts[2]);
      const z = parseInt(parts[3]);
      
      if (!label) {
        warnings.push({ line, issue: 'Missing label' });
        continue;
      }
      
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        warnings.push({ line, issue: 'Invalid coordinates (must be numbers)' });
        continue;
      }
      
      // Warn about potentially incomplete coordinates
      if (Math.abs(z) < 10 && Math.abs(x) > 100) {
        warnings.push({ line, issue: 'Z coordinate seems unusually small - is it complete?' });
      }
      
      if (Math.abs(y) > 500) {
        warnings.push({ line, issue: 'Y coordinate seems unusually high/low for Minecraft' });
      }
      
      coordinates.push({ x, y, z, label });
    }
    
    return { coordinates, warnings };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const { coordinates, warnings } = parseCoordinates(formData.coordinates);
    setParseWarnings(warnings);

    // Still create the map even with warnings, but show them to the user
    onCreateMap({
      name: formData.name.trim(),
      description: formData.description.trim(),
    }, coordinates);

    setFormData({ name: '', description: '', coordinates: '' });
    setParseWarnings([]);
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear warnings when coordinates change
    if (field === 'coordinates') {
      setParseWarnings([]);
    }
  };

  // Real-time parsing for warnings
  const handleCoordinatesChange = (value: string) => {
    handleInputChange('coordinates', value);
    if (value.trim()) {
      const { warnings } = parseCoordinates(value);
      setParseWarnings(warnings);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="minecraft-button bg-green-600 border-green-800 text-white hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Map
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                onChange={(e) => handleCoordinatesChange(e.target.value)}
                placeholder="Home Base, 100, 64, 200&#10;Mine Entrance, -50, 70, 150&#10;Spawn Point, 0, 80, 0"
                rows={8}
                className="font-mono text-sm"
              />
              
              {parseWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2 mt-2">
                  <div className="flex items-center gap-2 font-medium text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    Coordinate Warnings
                  </div>
                  <div className="space-y-1 text-sm">
                    {parseWarnings.map((warning, index) => (
                      <div key={index} className="text-yellow-700">
                        <div className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded mb-1">
                          {warning.line}
                        </div>
                        <div className="ml-2">⚠️ {warning.issue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-2">
                <strong>Format:</strong> label, x, y, z (one per line)<br />
                <strong>Example:</strong><br />
                Home Base, 100, 64, 200<br />
                Mine Entrance, -50, 70, 150<br />
                <br />
                <strong>Tips:</strong><br />
                • Double-check Z coordinates aren't cut off<br />
                • Y coordinates are typically 0-320 in Minecraft<br />
                • Use complete coordinate values for accuracy
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
