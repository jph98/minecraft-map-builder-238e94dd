
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
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 relative overflow-hidden">
      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
        {/* Header with Minecraft Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-amber-600 border-4 border-amber-800 rounded-sm shadow-lg">
              <Map className="w-10 h-10 text-white" />
            </div>
            <div className="p-4 bg-stone-600 border-4 border-stone-800 rounded-sm shadow-lg">
              <Pickaxe className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-3" style={{ textShadow: '4px 4px 0px #000' }}>
            MINECRAFT
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-xl mb-2" style={{ textShadow: '2px 2px 0px #000' }}>
            MAP BUILDER
          </h2>
          <p className="text-lg md:text-xl text-white drop-shadow-lg" style={{ textShadow: '1px 1px 0px #000' }}>
            Create and manage 2D maps with coordinate tracking
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create Map */}
          <MapManager onCreateMap={handleCreateMapAndNavigate} />

          {/* Map List */}
          <Card className="bg-stone-100 border-4 border-stone-600 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-stone-200 to-stone-300 border-b-4 border-stone-600">
              <CardTitle className="text-2xl md:text-3xl text-stone-800">Your Maps</CardTitle>
              <CardDescription className="text-stone-600">
                {maps.length === 0 ? 'No maps created yet. Create your first map to get started!' : `${maps.length} map${maps.length > 1 ? 's' : ''} created`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {maps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-amber-600 border-4 border-amber-800 rounded-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Map className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-stone-800">No Maps Yet</h3>
                  <p className="text-stone-600 mb-4">Create your first map to start plotting coordinates and building your Minecraft world reference.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
