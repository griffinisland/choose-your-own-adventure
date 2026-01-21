'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

interface CardNodeData {
  card: Card;
  imageUrl: string | null;
  choices: Choice[];
  isSelected: boolean;
}

export const CardNode = memo(({ data }: NodeProps<CardNodeData>) => {
  const { card, imageUrl, choices, isSelected } = data;

  // Get choices for this card, sorted by order
  const cardChoices = choices
    .filter((c) => c.cardId === card.id)
    .sort((a, b) => a.order - b.order);

  // Truncate caption to 3 lines
  const truncateCaption = (text: string, maxLines: number = 3) => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  // Truncate choice label to 1 line
  const truncateChoice = (text: string) => {
    if (text.length <= 30) return text; // Approximate 1 line
    return text.substring(0, 30) + '...';
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md overflow-hidden ${
        isSelected
          ? 'ring-4 ring-[#1083C0]'
          : 'border border-gray-200'
      }`}
      style={{ width: '256px' }}
    >
      {/* Target handle - cards can receive connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-[#1083C0] !border-2 !border-white !rounded-full"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Image thumbnail */}
      <div className="w-full flex justify-center" style={{ height: '126px', backgroundColor: '#f3f4f6' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.caption || 'Card image'}
            className="object-cover"
            style={{ width: '224px', height: '126px' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Caption - 3 lines max */}
      <div className="px-3 py-2 min-h-[60px]">
        <p
          className="text-sm text-gray-800 leading-tight"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {card.caption || 'Untitled Card'}
        </p>
      </div>

      {/* Choices */}
      {cardChoices.length > 0 && (
        <div className="px-3 pb-3 space-y-2">
          {cardChoices.map((choice, index) => (
            <div key={choice.id} className="relative flex items-center gap-2">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 rounded text-left truncate"
                title={choice.label}
                onClick={(e) => {
                  e.stopPropagation();
                  // Prevent card selection when clicking choice button
                }}
              >
                {truncateChoice(choice.label || 'Choice')}
              </button>
              {/* Connection handle for this choice */}
              <Handle
                type="source"
                id={`choice-${choice.id}`}
                position={Position.Right}
                className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full"
                style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* If no choices, show placeholder */}
      {cardChoices.length === 0 && (
        <div className="px-3 pb-3">
          <div className="text-xs text-gray-400 italic">No choices yet</div>
        </div>
      )}
    </div>
  );
});

CardNode.displayName = 'CardNode';
