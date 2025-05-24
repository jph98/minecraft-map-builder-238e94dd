
export interface Coordinate {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  color?: string;
}

export interface MinecraftMap {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
