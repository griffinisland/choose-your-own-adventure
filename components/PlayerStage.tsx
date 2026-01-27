'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type SceneElement = AppSchema['sceneElements'];

interface PlayerStageProps {
  cards: Card[];
  choices: Choice[];
  sceneElements: SceneElement[];
  startCardId: string | null;
  cardImages: Record<string, string>;
  backgroundImages: Record<string, string>;
  elementImages: Record<string, string>;
}

export function PlayerStage({
  cards,
  choices,
  sceneElements,
  startCardId,
  cardImages,
  backgroundImages,
  elementImages,
}: PlayerStageProps) {
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  useEffect(() => {
    if (startCardId && cards.find((c) => c.id === startCardId)) {
      setCurrentCardId(startCardId);
    } else if (cards.length > 0) {
      setCurrentCardId(cards[0].id);
    }
  }, [startCardId, cards]);

  const currentCard = cards.find((c) => c.id === currentCardId);
  const currentChoices = choices
    .filter((ch) => ch.cardId === currentCardId)
    .sort((a, b) => a.order - b.order);

  // Get scene elements for current card
  const currentSceneElements = useMemo(() => {
    if (!currentCardId) return [];
    return sceneElements
      .filter((el) => el.cardId === currentCardId)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [sceneElements, currentCardId]);

  const currentBackgroundUrl = currentCardId ? backgroundImages[currentCardId] || null : null;
  const hasScene = currentBackgroundUrl || currentSceneElements.length > 0;

  if (!currentCard) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No cards available</p>
          <p className="text-gray-400">This adventure has no content yet.</p>
        </div>
      </div>
    );
  }

  const imageUrl = cardImages[currentCard.id] || null;

  const handleChoiceClick = (choice: Choice) => {
    if (choice.targetCardId) {
      const targetExists = cards.some((c) => c.id === choice.targetCardId);
      if (targetExists) {
        setCurrentCardId(choice.targetCardId);
      } else {
        alert('This choice goes nowhere yet.');
      }
    } else {
      alert('This choice goes nowhere yet.');
    }
  };

  const handleElementClick = (element: SceneElement) => {
    if (element.targetCardId) {
      const targetExists = cards.some((c) => c.id === element.targetCardId);
      if (targetExists) {
        setCurrentCardId(element.targetCardId);
      } else {
        alert('This element links to a card that no longer exists.');
      }
    }
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col overflow-hidden">
      {/* Image/Scene Section - Takes up most of the vertical space */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 overflow-hidden relative">
        {hasScene ? (
          <>
            {/* Background */}
            {currentBackgroundUrl ? (
              <img
                src={currentBackgroundUrl}
                alt="Scene background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
            {/* Scene Elements */}
            {currentSceneElements.map((element) => {
              const elementUrl = elementImages[element.id];
              if (!elementUrl) return null;

              return (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: `${element.positionX * 100}%`,
                    top: `${element.positionY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: element.zIndex,
                    cursor: element.targetCardId ? 'pointer' : 'default',
                  }}
                  onClick={() => handleElementClick(element)}
                  title={element.targetCardId ? 'Click to navigate' : undefined}
                >
                  <img
                    src={elementUrl}
                    alt="Scene element"
                    className="max-w-full max-h-full"
                    style={{
                      width: element.width ? `${element.width}px` : 'auto',
                      height: element.height ? `${element.height}px` : 'auto',
                    }}
                    draggable={false}
                  />
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Fallback to old card image display */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={currentCard.caption || 'Card image'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-gray-400 text-lg">No image</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Content Section - Caption and Buttons */}
      <div className="bg-white px-8 py-6 flex flex-col gap-6">
        {/* Caption Text */}
        {currentCard.caption && (
          <div className="w-full max-w-4xl mx-auto">
            <p className="text-lg leading-relaxed text-gray-900">
              {currentCard.caption}
            </p>
          </div>
        )}

        {/* Choice Buttons - Side by side */}
        {currentChoices.length > 0 && (
          <div className="w-full max-w-4xl mx-auto flex flex-wrap gap-4 justify-center">
            {currentChoices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceClick(choice)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-md shadow-md transition-colors duration-200 min-w-[120px]"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
