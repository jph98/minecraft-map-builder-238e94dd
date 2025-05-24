
import React, { useState, ReactNode } from 'react';
import { MinecraftMap, Coordinate } from '@/types/map';
import { toast } from 'sonner';

interface AppContextType {
  maps: MinecraftMap[];
  handleCreateMap: (mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>) => MinecraftMap;
  handleUpdateMap: (mapId: string, updates: { name: string; description: string }) => void;
  handleDeleteMap: (mapId: string) => void;
  handleAddCoordinate: (mapId: string, coordinateData: Omit<Coordinate, 'id'>) => void;
  handleBulkImportCoordinates: (mapId: string, coordinatesData: Omit<Coordinate, 'id'>[]) => void;
  handleDeleteCoordinate: (mapId: string, coordinateId: string) => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [maps, setMaps] = useState<MinecraftMap[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleCreateMap = (mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>): MinecraftMap => {
    const newMap: MinecraftMap = {
      ...mapData,
      id: generateId(),
      coordinates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMaps(prev => [...prev, newMap]);
    toast.success(`Map "${newMap.name}" created successfully!`);
    return newMap;
  };

  const handleUpdateMap = (mapId: string, updates: { name: string; description: string }) => {
    const updatedMap = maps.find(m => m.id === mapId);
    if (!updatedMap) return;

    const newMap = {
      ...updatedMap,
      ...updates,
      updatedAt: new Date(),
    };

    setMaps(prev => prev.map(m => m.id === mapId ? newMap : m));
    toast.success(`Map "${newMap.name}" updated successfully!`);
  };

  const handleDeleteMap = (mapId: string) => {
    const mapToDelete = maps.find(m => m.id === mapId);
    setMaps(prev => prev.filter(m => m.id !== mapId));
    toast.success(`Map "${mapToDelete?.name}" deleted successfully!`);
  };

  const handleAddCoordinate = (mapId: string, coordinateData: Omit<Coordinate, 'id'>) => {
    const selectedMap = maps.find(m => m.id === mapId);
    if (!selectedMap) return;

    const newCoordinate: Coordinate = {
      ...coordinateData,
      id: generateId(),
    };

    const updatedMap = {
      ...selectedMap,
      coordinates: [...selectedMap.coordinates, newCoordinate],
      updatedAt: new Date(),
    };

    setMaps(prev => prev.map(m => m.id === mapId ? updatedMap : m));
    toast.success(`Coordinate "${newCoordinate.label}" added!`);
  };

  const handleBulkImportCoordinates = (mapId: string, coordinatesData: Omit<Coordinate, 'id'>[]) => {
    const selectedMap = maps.find(m => m.id === mapId);
    if (!selectedMap) return;

    const newCoordinates: Coordinate[] = coordinatesData.map(coord => ({
      ...coord,
      id: generateId(),
    }));

    const updatedMap = {
      ...selectedMap,
      coordinates: [...selectedMap.coordinates, ...newCoordinates],
      updatedAt: new Date(),
    };

    setMaps(prev => prev.map(m => m.id === mapId ? updatedMap : m));
    toast.success(`Imported ${newCoordinates.length} coordinate${newCoordinates.length > 1 ? 's' : ''}`);
  };

  const handleDeleteCoordinate = (mapId: string, coordinateId: string) => {
    const selectedMap = maps.find(m => m.id === mapId);
    if (!selectedMap) return;

    const coordToDelete = selectedMap.coordinates.find(c => c.id === coordinateId);
    const updatedMap = {
      ...selectedMap,
      coordinates: selectedMap.coordinates.filter(c => c.id !== coordinateId),
      updatedAt: new Date(),
    };

    setMaps(prev => prev.map(m => m.id === mapId ? updatedMap : m));
    toast.success(`Coordinate "${coordToDelete?.label}" deleted!`);
  };

  const value: AppContextType = {
    maps,
    handleCreateMap,
    handleUpdateMap,
    handleDeleteMap,
    handleAddCoordinate,
    handleBulkImportCoordinates,
    handleDeleteCoordinate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
