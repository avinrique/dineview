'use client';

import { useState } from 'react';

interface ArHotspotProps {
  label: string;
  content: string;
  type: 'ingredient' | 'nutrition' | 'allergen' | 'info';
  x: number;
  y: number;
}

const typeColors: Record<string, string> = {
  ingredient: 'bg-green-500',
  nutrition: 'bg-blue-500',
  allergen: 'bg-red-500',
  info: 'bg-yellow-500',
};

const typeIcons: Record<string, string> = {
  ingredient: '\u{1F96C}',
  nutrition: '\u{1F4CA}',
  allergen: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
};

export function ArHotspot({ label, content, type, x, y }: ArHotspotProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      {/* Hotspot dot */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-8 h-8 rounded-full ${typeColors[type]} text-white flex items-center justify-center shadow-lg animate-pulse-slow border-2 border-white`}
      >
        <span className="text-sm">{typeIcons[type]}</span>
      </button>

      {/* Expanded label */}
      {expanded && (
        <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-3 min-w-[180px] z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${typeColors[type]}`} />
            <span className="font-semibold text-sm text-gray-900">{label}</span>
          </div>
          <p className="text-xs text-gray-600">{content}</p>
        </div>
      )}
    </div>
  );
}
