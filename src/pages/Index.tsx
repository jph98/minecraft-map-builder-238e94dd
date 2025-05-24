
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
      {/* Minecraft Characters Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Creeper - Top Left */}
        <div className="absolute top-10 left-10 w-24 h-32 bg-green-600 border-4 border-green-800 rounded-sm transform rotate-12 opacity-20">
          <div className="w-full h-8 bg-green-700 mt-4"></div>
          <div className="flex justify-center mt-2">
            <div className="w-3 h-3 bg-black rounded-sm mx-1"></div>
            <div className="w-3 h-3 bg-black rounded-sm mx-1"></div>
          </div>
          <div className="flex justify-center mt-1">
            <div className="w-2 h-4 bg-black rounded-sm"></div>
          </div>
        </div>

        {/* Villager - Top Right */}
        <div className="absolute top-16 right-16 w-20 h-28 bg-amber-700 border-4 border-amber-900 rounded-sm transform -rotate-12 opacity-20">
          <div className="w-full h-6 bg-amber-600 mt-2"></div>
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-black rounded-full mx-1"></div>
            <div className="w-2 h-2 bg-black rounded-full mx-1"></div>
          </div>
          <div className="w-8 h-2 bg-pink-400 mx-auto mt-1"></div>
        </div>

        {/* Zombie - Bottom Left */}
        <div className="absolute bottom-20 left-20 w-22 h-30 bg-green-400 border-4 border-green-600 rounded-sm transform rotate-6 opacity-20">
          <div className="w-full h-6 bg-green-500 mt-2"></div>
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-red-600 rounded-sm mx-1"></div>
            <div className="w-2 h-2 bg-red-600 rounded-sm mx-1"></div>
          </div>
          <div className="w-6 h-1 bg-black mx-auto mt-1"></div>
        </div>

        {/* Pig - Bottom Right */}
        <div className="absolute bottom-24 right-24 w-24 h-20 bg-pink-400 border-4 border-pink-600 rounded-sm transform -rotate-6 opacity-20">
          <div className="w-full h-4 bg-pink-500 mt-2"></div>
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-black rounded-sm mx-1"></div>
            <div className="w-2 h-2 bg-black rounded-sm mx-1"></div>
          </div>
          <div className="w-4 h-2 bg-pink-600 mx-auto mt-1"></div>
        </div>

        {/* Additional smaller characters scattered around */}
        <div className="absolute top-1/3 left-1/4 w-16 h-20 bg-green-600 border-2 border-green-800 rounded-sm transform rotate-45 opacity-15"></div>
        <div className="absolute top-2/3 right-1/3 w-14 h-18 bg-pink-400 border-2 border-pink-600 rounded-sm transform -rotate-30 opacity-15"></div>
        <div className="absolute bottom-1/3 left-2/3 w-18 h-22 bg-amber-700 border-2 border-amber-900 rounded-sm transform rotate-20 opacity-15"></div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
        {/* Header with Minecraft Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-amber-600 border-4 border-amber-800 rounded-sm shadow-lg" style={{ fontFamily: 'monospace' }}>
              <Map className="w-10 h-10 text-white" />
            </div>
            <div className="p-4 bg-stone-600 border-4 border-stone-800 rounded-sm shadow-lg" style={{ fontFamily: 'monospace' }}>
              <Pickaxe className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-3" style={{ fontFamily: 'monospace', textShadow: '4px 4px 0px #000' }}>
            MINECRAFT
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-xl mb-2" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0px #000' }}>
            MAP BUILDER
          </h2>
          <p className="text-lg md:text-xl text-white drop-shadow-lg" style={{ fontFamily: 'monospace', textShadow: '1px 1px 0px #000' }}>
            Create and manage 2D maps with coordinate tracking
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create Map */}
          <MapManager onCreateMap={handleCreateMapAndNavigate} />

          {/* Map List */}
          <Card className="bg-stone-100 border-4 border-stone-600 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-stone-200 to-stone-300 border-b-4 border-stone-600">
              <CardTitle className="text-2xl md:text-3xl text-stone-800" style={{ fontFamily: 'monospace' }}>Your Maps</CardTitle>
              <CardDescription className="text-stone-600" style={{ fontFamily: 'monospace' }}>
                {maps.length === 0 ? 'No maps created yet. Create your first map to get started!' : `${maps.length} map${maps.length > 1 ? 's' : ''} created`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {maps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-amber-600 border-4 border-amber-800 rounded-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Map className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-stone-800" style={{ fontFamily: 'monospace' }}>No Maps Yet</h3>
                  <p className="text-stone-600 mb-4" style={{ fontFamily: 'monospace' }}>Create your first map to start plotting coordinates and building your Minecraft world reference.</p>
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
