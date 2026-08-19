
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { MinecraftMap, Coordinate } from '@/types/map';
import { MapCanvas } from '@/components/MapCanvas';
import { MapEditDialog } from '@/components/MapEditDialog';
import { CoordinateForm } from '@/components/CoordinateForm';
import { CoordinateEditDialog } from '@/components/CoordinateEditDialog';
import { BulkCoordinateImport } from '@/components/BulkCoordinateImport';
import { FullScreenMap } from '@/components/FullScreenMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Loader2, MapPin, X } from 'lucide-react';

const MapDetail = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { maps, loading, handleUpdateMap, handleDeleteMap, handleAddCoordinate, handleUpdateCoordinate, handleBulkImportCoordinates, handleDeleteCoordinate } = useApp();
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingMap, setEditingMap] = useState<MinecraftMap | null>(null);
  const [placeMode, setPlaceMode] = useState(false);
  const [draftCoordinate, setDraftCoordinate] = useState<Omit<Coordinate, 'id'> | null>(null);
  const [editingCoordinate, setEditingCoordinate] = useState<Coordinate | null>(null);

  const selectedMap = maps.find(m => m.id === mapId);

  if (loading && !selectedMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!selectedMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">Map Not Found</h3>
            <p className="text-gray-600 mb-4">The requested map could not be found.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Maps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteMapAndNavigate = () => {
    handleDeleteMap(selectedMap.id);
    navigate('/');
  };

  const handleFullScreen = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto max-w-full px-3 py-4 sm:px-4 md:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Maps
          </Button>
          <div className="order-last w-full min-w-0 sm:order-none sm:flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900 break-words">{selectedMap.name}</h1>
            <p className="text-sm sm:text-base text-amber-700 break-words">{selectedMap.description}</p>
          </div>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {selectedMap.coordinates.length} coordinates
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEditingMap(selectedMap)}>
            <Edit className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteMapAndNavigate}>
            <Trash2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 min-w-0">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4 min-w-0">
            <CoordinateForm onAddCoordinate={(coordinateData) => handleAddCoordinate(selectedMap.id, coordinateData)} />
            <BulkCoordinateImport onImportCoordinates={(coordinatesData) => handleBulkImportCoordinates(selectedMap.id, coordinatesData)} />
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6 min-w-0">
            {/* Map Canvas */}
            <Card>
              <CardHeader className="px-3 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg md:text-xl">Map View</CardTitle>
                  <Button
                    variant={placeMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlaceMode(v => !v)}
                  >
                    {placeMode ? <X className="w-4 h-4 mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                    {placeMode ? 'Cancel' : 'Add Location on Map'}
                  </Button>
                </div>
                <CardDescription className="text-sm">
                  {placeMode
                    ? 'Tap anywhere on the map to drop a new location, then name it.'
                    : 'Drag or swipe to pan • Pinch or use controls to zoom • Tap a point for details'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <MapCanvas
                  map={selectedMap}
                  selectedCoordinate={selectedCoordinate}
                  onCoordinateSelect={setSelectedCoordinate}
                  onFullScreen={handleFullScreen}
                  placeMode={placeMode}
                  onPlacePoint={(x, z) => {
                    setDraftCoordinate({ x, y: 64, z, label: '' });
                    setPlaceMode(false);
                  }}
                />
              </CardContent>
            </Card>

            {/* Coordinate Details */}
            {selectedCoordinate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                    Coordinate Details
                    <span className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCoordinate(selectedCoordinate)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCoordinate(selectedMap.id, selectedCoordinate.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </span>
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
                        <div className="flex shrink-0 items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCoordinate(coord);
                            }}
                            aria-label={`Edit ${coord.label}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCoordinate(selectedMap.id, coord.id);
                            }}
                            aria-label={`Delete ${coord.label}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      {isFullScreen && (
        <FullScreenMap
          map={selectedMap}
          selectedCoordinate={selectedCoordinate}
          onCoordinateSelect={setSelectedCoordinate}
          onClose={handleCloseFullScreen}
        />
      )}

      {/* Add / Edit Location Dialogs */}
      <CoordinateEditDialog
        isOpen={!!draftCoordinate}
        onOpenChange={(open) => !open && setDraftCoordinate(null)}
        coordinate={draftCoordinate}
        mode="create"
        onSave={(values) => {
          handleAddCoordinate(selectedMap.id, values);
          setDraftCoordinate(null);
        }}
      />

      <CoordinateEditDialog
        isOpen={!!editingCoordinate}
        onOpenChange={(open) => !open && setEditingCoordinate(null)}
        coordinate={editingCoordinate}
        mode="edit"
        onSave={(values) => {
          if (editingCoordinate) {
            handleUpdateCoordinate(selectedMap.id, editingCoordinate.id, values);
            setSelectedCoordinate(prev => (prev && prev.id === editingCoordinate.id ? { ...prev, ...values } : prev));
          }
          setEditingCoordinate(null);
        }}
      />

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

export default MapDetail;
