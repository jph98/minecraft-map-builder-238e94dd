
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { MinecraftMap } from '@/types/map';
import { MapCard } from '@/components/MapCard';
import { MapManager } from '@/components/MapManager';
import { MapEditDialog } from '@/components/MapEditDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Pickaxe } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { maps, handleCreateMap, handleUpdateMap, handleDeleteMap } = useApp();
  const [editingMap, setEditingMap] = useState<MinecraftMap | null>(null);

  const handleCreateMapAndNavigate = (mapData: Omit<MinecraftMap, 'id' | 'coordinates' | 'createdAt' | 'updatedAt'>) => {
    const newMap = handleCreateMap(mapData);
    navigate(`/map/${newMap.id}`);
  };

  const handleSelectMap = (map: MinecraftMap) => {
    navigate(`/map/${map.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header with Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-600 rounded-lg">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="p-3 bg-orange-600 rounded-lg">
              <Pickaxe className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-2">Minecraft Map Builder</h1>
          <p className="text-base md:text-lg text-amber-700">Create and manage 2D maps with coordinate tracking</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create Map */}
          <MapManager onCreateMap={handleCreateMapAndNavigate} />

          {/* Map List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Your Maps</CardTitle>
              <CardDescription>
                {maps.length === 0 ? 'No maps created yet. Create your first map to get started!' : `${maps.length} map${maps.length > 1 ? 's' : ''} created`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Map className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Maps Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first map to start plotting coordinates and building your Minecraft world reference.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {maps.map(map => (
                    <MapCard
                      key={map.id}
                      map={map}
                      onSelect={handleSelectMap}
                      onDelete={handleDeleteMap}
                      onEdit={setEditingMap}
                      isSelected={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
