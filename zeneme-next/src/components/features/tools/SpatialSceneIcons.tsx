import React from 'react';

export interface SceneItem {
  id: string;
  type: 'house' | 'cat' | 'tree' | 'car' | 'sign' | 'traffic_light' | 'flower';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

interface SpatialSceneIconsProps {
  items: SceneItem[];
}

// Simple icon components using Unicode/Emoji
const iconMap: Record<string, string> = {
  house: '🏠',
  cat: '🐱',
  tree: '🌳',
  car: '🚗',
  sign: '🛑',
  traffic_light: '🚦',
  flower: '🌸',
};

export const SpatialSceneIcons: React.FC<SpatialSceneIconsProps> = ({ items }) => {
  return (
    <div className="relative w-full h-48 bg-slate-900/40 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
      {items.map((item) => {
        const icon = iconMap[item.type] || '🏠';

        return (
          <div
            key={item.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
};
