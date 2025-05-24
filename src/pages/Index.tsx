import React, { useState } from 'react';
import { MinecraftMap, Coordinate } from '@/types/map';
import { MapCanvas } from '@/components/MapCanvas';
import { MapCard } from '@/components/MapCard';
import { MapManager } from '@/components/MapManager';
import { MapEditDialog } from '@/components/MapEditDialog';
import { CoordinateForm } from '@/components/CoordinateForm';
import { BulkCoordinateImport } from '@/components/BulkCoordinateImport';
import { FullScreenMap } from '@/components/FullScreenMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [maps, setMaps] = useState<MinecraftMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<MinecraftMap | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingMap, setEditingMap] = useState<MinecraftMap | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleCreateMap = (mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>) => {
    const newMap: MinecraftMap = {
      ...mapData,
      id: generateId(),
      coordinates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMaps(prev => [...prev, newMap]);
    setSelectedMap(newMap);
    toast.success(`Map "${newMap.name}" created successfully!`);
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
    if (selectedMap?.id === mapId) {
      setSelectedMap(newMap);
    }
    toast.success(`Map "${newMap.name}" updated successfully!`);
  };

  const handleDeleteMap = (mapId: string) => {
    const mapToDelete = maps.find(m => m.id === mapId);
    setMaps(prev => prev.filter(m => m.id !== mapId));
    
    if (selectedMap?.id === mapId) {
      setSelectedMap(null);
      setSelectedCoordinate(null);
    }
    
    toast.success(`Map "${mapToDelete?.name}" deleted successfully!`);
  };

  const handleAddCoordinate = (coordinateData: Omit<Coordinate, 'id'>) => {
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

    setMaps(prev => prev.map(m => m.id === selectedMap.id ? updatedMap : m));
    setSelectedMap(updatedMap);
    toast.success(`Coordinate "${newCoordinate.label}" added!`);
  };

  const handleBulkImportCoordinates = (coordinatesData: Omit<Coordinate, 'id'>[]) => {
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

    setMaps(prev => prev.map(m => m.id === selectedMap.id ? updatedMap : m));
    setSelectedMap(updatedMap);
  };

  const handleDeleteCoordinate = (coordinateId: string) => {
    if (!selectedMap) return;

    const coordToDelete = selectedMap.coordinates.find(c => c.id === coordinateId);
    const updatedMap = {
      ...selectedMap,
      coordinates: selectedMap.coordinates.filter(c => c.id !== coordinateId),
      updatedAt: new Date(),
    };

    setMaps(prev => prev.map(m => m.id === selectedMap.id ? updatedMap : m));
    setSelectedMap(updatedMap);
    setSelectedCoordinate(null);
    toast.success(`Coordinate "${coordToDelete?.label}" deleted!`);
  };

  const handleFullScreen = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-2">Minecraft Map Builder</h1>
          <p className="text-base md:text-lg text-amber-700">Create and manage 2D maps with coordinate tracking</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4 md:space-y-6">
            {/* Create Map */}
            <MapManager onCreateMap={handleCreateMap} />

            {/* Map List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Your Maps</CardTitle>
                <CardDescription>
                  {maps.length === 0 ? 'No maps created yet' : `${maps.length} map${maps.length > 1 ? 's' : ''} created`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {maps.map(map => (
                  <MapCard
                    key={map.id}
                    map={map}
                    onSelect={setSelectedMap}
                    onDelete={handleDeleteMap}
                    onEdit={setEditingMap}
                    isSelected={selectedMap?.id === map.id}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Add Coordinate Form - Show on mobile only when map is selected */}
            {selectedMap && (
              <div className="space-y-4 xl:block">
                <CoordinateForm onAddCoordinate={handleAddCoordinate} />
                <BulkCoordinateImport onImportCoordinates={handleBulkImportCoordinates} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            {selectedMap ? (
              <>
                {/* Map Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl md:text-2xl truncate">{selectedMap.name}</CardTitle>
                        <CardDescription className="mt-1">{selectedMap.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-sm shrink-0">
                        {selectedMap.coordinates.length} coordinates
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Map Canvas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Map View</CardTitle>
                    <CardDescription className="text-sm">
                      Click and drag to pan • Use zoom controls • Click coordinates for details • Full screen available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MapCanvas
                      map={selectedMap}
                      selectedCoordinate={selectedCoordinate}
                      onCoordinateSelect={setSelectedCoordinate}
                      onFullScreen={handleFullScreen}
                    />
                  </CardContent>
                </Card>

                {/* Coordinate Details */}
                {selectedCoordinate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                        Coordinate Details
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCoordinate(selectedCoordinate.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base md:text-lg">{selectedCoordinate.label}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">X:</span> {selectedCoordinate.x}
                          </div>
                          <div>
                            <span className="font-medium">Y:</span> {selectedCoordinate.y}
                          </div>
                          <div>
                            <span className="font-medium">Z:</span> {selectedCoordinate.z}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Coordinates List */}
                {selectedMap.coordinates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">All Coordinates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMap.coordinates.map((coord, index) => (
                          <div
                            key={coord.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedCoordinate?.id === coord.id 
                                ? 'bg-amber-50 border-amber-200' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedCoordinate(coord)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{coord.label}</div>
                              <div className="text-sm text-gray-600">
                                ({coord.x}, {coord.y}, {coord.z})
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCoordinate(coord.id);
                              }}
                              className="shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="text-center py-8 md:py-12">
                <CardContent>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No Map Selected</h3>
                  <p className="text-gray-600 mb-4">
                    Create a new map or select an existing one to start plotting coordinates
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      {isFullScreen && selectedMap && (
        <FullScreenMap
          map={selectedMap}
          selectedCoordinate={selectedCoordinate}
          onCoordinateSelect={setSelectedCoordinate}
          onClose={handleCloseFullScreen}
        />
      )}

      {/* Edit Map Dialog */}
      {editingMap && (
        <MapEditDialog
          map={editingMap}
          onUpdateMap={handleUpdateMap}
          isOpen={!!editingMap}
          onOpenChange={(open) => !open && setEditingMap(null)}
        />
      )}
    </div>
  );
};

export default Index;
