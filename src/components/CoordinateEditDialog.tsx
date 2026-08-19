import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Coordinate } from '@/types/map';

interface CoordinateEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing location to edit, or a draft (no id) created by clicking the map. */
  coordinate: Coordinate | Omit<Coordinate, 'id'> | null;
  mode: 'create' | 'edit';
  onSave: (values: Omit<Coordinate, 'id'>) => void;
}

export const CoordinateEditDialog: React.FC<CoordinateEditDialogProps> = ({
  isOpen, onOpenChange, coordinate, mode, onSave,
}) => {
  const [form, setForm] = useState({ label: '', x: '0', y: '64', z: '0' });

  useEffect(() => {
    if (coordinate) {
      setForm({
        label: coordinate.label ?? '',
        x: String(coordinate.x ?? 0),
        y: String(coordinate.y ?? 64),
        z: String(coordinate.z ?? 0),
      });
    }
  }, [coordinate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    onSave({
      label: form.label.trim(),
      x: parseInt(form.x, 10) || 0,
      y: parseInt(form.y, 10) || 0,
      z: parseInt(form.z, 10) || 0,
    });
    onOpenChange(false);
  };

  const set = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New Location' : 'Edit Location'}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Name this spot and adjust its coordinates before saving.'
                : 'Update the name or coordinates of this location.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="loc-label">Label</Label>
              <Input
                id="loc-label"
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="Home Base"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="loc-x">X</Label>
                <Input id="loc-x" type="number" value={form.x} onChange={e => set('x', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="loc-y">Y</Label>
                <Input id="loc-y" type="number" value={form.y} onChange={e => set('y', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="loc-z">Z</Label>
                <Input id="loc-z" type="number" value={form.z} onChange={e => set('z', e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === 'create' ? 'Add Location' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
