'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type SceneElement = AppSchema['sceneElements'];

interface CardNodeData {
  card: Card;
  imageUrl: string | null;
  backgroundImageUrl: string | null;
  sceneElements: SceneElement[];
  elementImages: Record<string, string>;
  choices: Choice[];
  isSelected: boolean;
}

export const CardNode = memo(({ data }: NodeProps<CardNodeData>) => {
  const { card, imageUrl, backgroundImageUrl, sceneElements, elementImages, choices, isSelected } = data;
  
  // Thumbnail dimensions
  const thumbnailWidth = 224;
  const thumbnailHeight = 126;

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
      style={{ width: '256px', pointerEvents: 'auto' }}
    >
      {/* Target handle - cards can receive connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-[#1083C0] !border-2 !border-white !rounded-full"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Image thumbnail - Show complete scene (background + elements) if available, otherwise show card image */}
      <div className="w-full flex justify-center relative" style={{ height: '126px', backgroundColor: '#f3f4f6' }}>
        {backgroundImageUrl || sceneElements.length > 0 ? (
          <div className="relative" style={{ width: `${thumbnailWidth}px`, height: `${thumbnailHeight}px` }}>
            {/* Background image */}
            {backgroundImageUrl ? (
              <img
                src={backgroundImageUrl}
                alt={card.caption || 'Scene background'}
                className="object-cover"
                style={{ width: `${thumbnailWidth}px`, height: `${thumbnailHeight}px`, pointerEvents: 'none' }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-200" style={{ pointerEvents: 'none' }} />
            )}
            
            {/* Scene elements overlaid on background */}
            {sceneElements.map((element) => {
              const elementUrl = elementImages[element.id];
              if (!elementUrl) return null;

              // Scale element dimensions to fit thumbnail (224x126)
              // Elements are positioned as percentages (0-1), so we can use those directly
              const elementWidth = element.width ? Math.min(element.width, thumbnailWidth * 0.8) : thumbnailWidth * 0.3;
              const elementHeight = element.height ? Math.min(element.height, thumbnailHeight * 0.8) : thumbnailHeight * 0.3;

              return (
                <img
                  key={element.id}
                  src={elementUrl}
                  alt="Scene element"
                  className="absolute"
                  style={{
                    left: `${element.positionX * 100}%`,
                    top: `${element.positionY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${elementWidth}px`,
                    height: `${elementHeight}px`,
                    zIndex: element.zIndex,
                    maxWidth: `${thumbnailWidth}px`,
                    maxHeight: `${thumbnailHeight}px`,
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              );
            })}
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={card.caption || 'Card image'}
            className="object-cover"
            style={{ width: '224px', height: '126px', pointerEvents: 'none' }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs" style={{ pointerEvents: 'none' }}>
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
