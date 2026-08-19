
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coordinate } from '@/types/map';
import { parseCoordinateLines, ParseWarning } from '@/lib/parseCoordinates';
import { Plus, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkCoordinateImportProps {
  onImportCoordinates: (coordinates: Omit<Coordinate, 'id'>[]) => void;
}

export const BulkCoordinateImport: React.FC<BulkCoordinateImportProps> = ({ onImportCoordinates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [parseWarnings, setParseWarnings] = useState<ParseWarning[]>([]);

  const parseCoordinates = parseCoordinateLines;

  const handleImport = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some coordinates to import');
      return;
    }

    const { coordinates, warnings } = parseCoordinates(textInput);
    setParseWarnings(warnings);
    
    if (coordinates.length === 0) {
      toast.error('No valid coordinates found. Format: label, x, y, z (one per line)');
      return;
    }

    if (warnings.length > 0) {
      toast.warning(`Found ${warnings.length} potential issue(s) with coordinates. Check the warnings below.`);
    }

    onImportCoordinates(coordinates);
    toast.success(`Imported ${coordinates.length} coordinate${coordinates.length > 1 ? 's' : ''}`);
    
    if (warnings.length === 0) {
      setTextInput('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Multi Add Coordinates
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
          
          {parseWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2">
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
          
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Format:</strong> label, x, y, z<br />
            <strong>Example:</strong><br />
            Home Base, 100, 64, 200<br />
            Mine Entrance, -50, 70, 150<br />
            <br />
            <strong>Tips:</strong><br />
            • Commas are optional — spaces work too<br />
            • Y coordinates are typically 0-320 in Minecraft<br />
            • Use complete coordinate values for accuracy
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
