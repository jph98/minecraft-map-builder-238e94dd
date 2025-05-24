
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { MinecraftMap, Coordinate } from '@/types/map';
import { MapCanvas } from '@/components/MapCanvas';
import { MapEditDialog } from '@/components/MapEditDialog';
import { CoordinateForm } from '@/components/CoordinateForm';
import { BulkCoordinateImport } from '@/components/BulkCoordinateImport';
import { FullScreenMap } from '@/components/FullScreenMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

const MapDetail = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { maps, handleUpdateMap, handleDeleteMap, handleAddCoordinate, handleBulkImportCoordinates, handleDeleteCoordinate } = useApp();
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingMap, setEditingMap] = useState<MinecraftMap | null>(null);

  const selectedMap = maps.find(m => m.id === mapId);

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Maps
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-900">{selectedMap.name}</h1>
            <p className="text-amber-700">{selectedMap.description}</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {selectedMap.coordinates.length} coordinates
          </Badge>
          <Button variant="outline" onClick={() => setEditingMap(selectedMap)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteMapAndNavigate}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <CoordinateForm onAddCoordinate={(coordinateData) => handleAddCoordinate(selectedMap.id, coordinateData)} />
            <BulkCoordinateImport onImportCoordinates={(coordinatesData) => handleBulkImportCoordinates(selectedMap.id, coordinatesData)} />
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
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
                      onClick={() => handleDeleteCoordinate(selectedMap.id, selectedCoordinate.id)}
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
                            handleDeleteCoordinate(selectedMap.id, coord.id);
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
