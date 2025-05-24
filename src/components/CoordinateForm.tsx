
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coordinate } from '@/types/map';
import { Plus } from 'lucide-react';

interface CoordinateFormProps {
  onAddCoordinate: (coordinate: Omit<Coordinate, 'id'>) => void;
}

export const CoordinateForm: React.FC<CoordinateFormProps> = ({ onAddCoordinate }) => {
  const [formData, setFormData] = useState({
    x: '',
    y: '',
    z: '',
    label: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim()) return;

    const coordinate: Omit<Coordinate, 'id'> = {
      x: parseInt(formData.x) || 0,
      y: parseInt(formData.y) || 0,
      z: parseInt(formData.z) || 0,
      label: formData.label.trim(),
    };

    onAddCoordinate(coordinate);
    setFormData({ x: '', y: '', z: '', label: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Coordinate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="x">X</Label>
              <Input
                id="x"
                type="number"
                value={formData.x}
                onChange={(e) => handleInputChange('x', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="y">Y</Label>
              <Input
                id="y"
                type="number"
                value={formData.y}
                onChange={(e) => handleInputChange('y', e.target.value)}
                placeholder="64"
              />
            </div>
            <div>
              <Label htmlFor="z">Z</Label>
              <Input
                id="z"
                type="number"
                value={formData.z}
                onChange={(e) => handleInputChange('z', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="Home Base"
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Add Coordinate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
