import React, { useState, useEffect, useCallback, ReactNode, createContext, useContext } from 'react';
import { MinecraftMap, Coordinate } from '@/types/map';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AppContextType {
  maps: MinecraftMap[];
  loading: boolean;
  handleCreateMap: (mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>, initialCoordinates?: Omit<Coordinate, 'id'>[]) => Promise<MinecraftMap | null>;
  handleUpdateMap: (mapId: string, updates: { name: string; description: string }) => void;
  handleDeleteMap: (mapId: string) => void;
  handleAddCoordinate: (mapId: string, coordinateData: Omit<Coordinate, 'id'>) => void;
  handleUpdateCoordinate: (mapId: string, coordinateId: string, updates: Omit<Coordinate, 'id'>) => void;
  handleBulkImportCoordinates: (mapId: string, coordinatesData: Omit<Coordinate, 'id'>[]) => void;
  handleDeleteCoordinate: (mapId: string, coordinateId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [maps, setMaps] = useState<MinecraftMap[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaps = useCallback(async () => {
    if (!user) {
      setMaps([]);
      return;
    }
    setLoading(true);
    const [{ data: mapRows, error: mapError }, { data: coordRows, error: coordError }] = await Promise.all([
      supabase.from('maps').select('*').order('created_at', { ascending: true }),
      supabase.from('coordinates').select('*').order('created_at', { ascending: true }),
    ]);
    setLoading(false);

    if (mapError || coordError) {
      toast.error('Could not load your maps.');
      return;
    }

    setMaps(
      (mapRows ?? []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        coordinates: (coordRows ?? [])
          .filter(c => c.map_id === row.id)
          .map(c => ({ id: c.id, x: c.x, y: c.y, z: c.z, label: c.label, color: c.color ?? undefined })),
      }))
    );
  }, [user]);

  useEffect(() => {
    void fetchMaps();
  }, [fetchMaps]);

  const handleCreateMap = async (
    mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>,
    initialCoordinates: Omit<Coordinate, 'id'>[] = []
  ): Promise<MinecraftMap | null> => {
    if (!user) return null;

    const { data: mapRow, error } = await supabase
      .from('maps')
      .insert({ user_id: user.id, name: mapData.name, description: mapData.description })
      .select()
      .single();

    if (error || !mapRow) {
      toast.error('Could not create the map.');
      return null;
    }

    let coordinates: Coordinate[] = [];
    if (initialCoordinates.length > 0) {
      const { data: coordRows, error: coordError } = await supabase
        .from('coordinates')
        .insert(initialCoordinates.map(c => ({ map_id: mapRow.id, user_id: user.id, label: c.label, x: c.x, y: c.y, z: c.z })))
        .select();
      if (coordError) {
        toast.error('Map created, but coordinates could not be saved.');
      } else {
        coordinates = (coordRows ?? []).map(c => ({ id: c.id, x: c.x, y: c.y, z: c.z, label: c.label, color: c.color ?? undefined }));
      }
    }

    const newMap: MinecraftMap = {
      id: mapRow.id,
      name: mapRow.name,
      description: mapRow.description ?? '',
      coordinates,
      createdAt: new Date(mapRow.created_at),
      updatedAt: new Date(mapRow.updated_at),
    };

    setMaps(prev => [...prev, newMap]);
    const coordText = coordinates.length > 0 ? ` with ${coordinates.length} coordinate${coordinates.length > 1 ? 's' : ''}` : '';
    toast.success(`Map "${newMap.name}" created successfully${coordText}!`);
    return newMap;
  };

  const handleUpdateMap = async (mapId: string, updates: { name: string; description: string }) => {
    const { error } = await supabase.from('maps').update(updates).eq('id', mapId);
    if (error) {
      toast.error('Could not update the map.');
      return;
    }
    setMaps(prev => prev.map(m => (m.id === mapId ? { ...m, ...updates, updatedAt: new Date() } : m)));
    toast.success(`Map "${updates.name}" updated successfully!`);
  };

  const handleDeleteMap = async (mapId: string) => {
    const mapToDelete = maps.find(m => m.id === mapId);
    const { error } = await supabase.from('maps').delete().eq('id', mapId);
    if (error) {
      toast.error('Could not delete the map.');
      return;
    }
    setMaps(prev => prev.filter(m => m.id !== mapId));
    toast.success(`Map "${mapToDelete?.name}" deleted successfully!`);
  };

  const handleAddCoordinate = async (mapId: string, coordinateData: Omit<Coordinate, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('coordinates')
      .insert({ map_id: mapId, user_id: user.id, label: coordinateData.label, x: coordinateData.x, y: coordinateData.y, z: coordinateData.z })
      .select()
      .single();
    if (error || !data) {
      toast.error('Could not add the coordinate.');
      return;
    }
    const newCoordinate: Coordinate = { id: data.id, x: data.x, y: data.y, z: data.z, label: data.label, color: data.color ?? undefined };
    setMaps(prev => prev.map(m => (m.id === mapId ? { ...m, coordinates: [...m.coordinates, newCoordinate], updatedAt: new Date() } : m)));
    toast.success(`Coordinate "${newCoordinate.label}" added!`);
  };

  const handleUpdateCoordinate = async (mapId: string, coordinateId: string, updates: Omit<Coordinate, 'id'>) => {
    const { error } = await supabase
      .from('coordinates')
      .update({ label: updates.label, x: updates.x, y: updates.y, z: updates.z })
      .eq('id', coordinateId);
    if (error) {
      toast.error('Could not update the location.');
      return;
    }
    setMaps(prev =>
      prev.map(m =>
        m.id === mapId
          ? { ...m, coordinates: m.coordinates.map(c => (c.id === coordinateId ? { ...c, ...updates } : c)), updatedAt: new Date() }
          : m
      )
    );
    toast.success(`Location "${updates.label}" updated!`);
  };

  const handleBulkImportCoordinates = async (mapId: string, coordinatesData: Omit<Coordinate, 'id'>[]) => {
    if (!user || coordinatesData.length === 0) return;
    const { data, error } = await supabase
      .from('coordinates')
      .insert(coordinatesData.map(c => ({ map_id: mapId, user_id: user.id, label: c.label, x: c.x, y: c.y, z: c.z })))
      .select();
    if (error) {
      toast.error('Could not import the coordinates.');
      return;
    }
    const newCoordinates: Coordinate[] = (data ?? []).map(c => ({ id: c.id, x: c.x, y: c.y, z: c.z, label: c.label, color: c.color ?? undefined }));
    setMaps(prev => prev.map(m => (m.id === mapId ? { ...m, coordinates: [...m.coordinates, ...newCoordinates], updatedAt: new Date() } : m)));
    toast.success(`Imported ${newCoordinates.length} coordinate${newCoordinates.length > 1 ? 's' : ''}`);
  };

  const handleDeleteCoordinate = async (mapId: string, coordinateId: string) => {
    const coordToDelete = maps.find(m => m.id === mapId)?.coordinates.find(c => c.id === coordinateId);
    const { error } = await supabase.from('coordinates').delete().eq('id', coordinateId);
    if (error) {
      toast.error('Could not delete the coordinate.');
      return;
    }
    setMaps(prev => prev.map(m => (m.id === mapId ? { ...m, coordinates: m.coordinates.filter(c => c.id !== coordinateId) } : m)));
    toast.success(`Coordinate "${coordToDelete?.label}" deleted!`);
  };

  const value: AppContextType = {
    maps,
    loading,
    handleCreateMap,
    handleUpdateMap,
    handleDeleteMap,
    handleAddCoordinate,
    handleUpdateCoordinate,
    handleBulkImportCoordinates,
    handleDeleteCoordinate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
