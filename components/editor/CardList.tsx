'use client';

import { useMemo } from 'react';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];

interface CardListProps {
  cards: Card[];
  cardImages: Record<string, string>;
  selectedCardId: string | null;
  onCardSelect: (cardId: string) => void;
}

export function CardList({
  cards,
  cardImages,
  selectedCardId,
  onCardSelect,
}: CardListProps) {
  const sortedCards = useMemo(() => {
    // Sort cards by creation order (using positionY as a proxy, or just keep original order)
    return [...cards].sort((a, b) => a.positionY - b.positionY);
  }, [cards]);

  if (cards.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No cards yet</p>
          <p className="text-gray-400 text-sm">Click "Add Card" to create your first card</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {sortedCards.map((card, index) => {
          const imageUrl = cardImages[card.id] || null;
          const isSelected = card.id === selectedCardId;

          return (
            <div
              key={card.id}
              onClick={() => onCardSelect(card.id)}
              className={`
                cursor-pointer rounded-lg border-2 p-4 bg-white transition-all
                ${isSelected 
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={card.caption || 'Card thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load card image:', imageUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      Card {index + 1}
                    </span>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-base font-medium text-gray-900 truncate">
                    {card.caption || 'Untitled Card'}
                  </p>
                  {card.caption && card.caption.length > 60 && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {card.caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
