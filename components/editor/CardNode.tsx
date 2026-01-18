import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Image from 'next/image';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];

interface CardNodeData {
  card: Card;
  imageUrl: string | null;
  isSelected: boolean;
}

export const CardNode = memo(({ data }: NodeProps<CardNodeData>) => {
  const { card, imageUrl, isSelected } = data;

  return (
    <div
      className={`relative w-48 h-32 bg-white rounded-lg shadow-md overflow-hidden border ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />

      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={card.caption.substring(0, 20)}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          No Image
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
        {card.caption || 'Untitled Card'}
      </div>
    </div>
  );
});
