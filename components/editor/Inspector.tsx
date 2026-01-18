'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

interface InspectorProps {
  card: Card | null;
  allCards: Card[];
  choices: Choice[];
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onUpdateChoice: (choiceId: string, updates: Partial<Choice>) => void;
  onCreateChoice: (
    cardId: string,
    label: string,
    targetCardId: string | null,
    order: number
  ) => void;
  onDeleteChoice: (choiceId: string) => void;
  onSetStartCard: (cardId: string) => void;
  onUploadImage: (cardId: string, file: File) => void;
  onDeleteCard?: (cardId: string) => void;
  isStartCard: boolean;
}

export function Inspector({
  card,
  allCards,
  choices,
  onUpdateCard,
  onUpdateChoice,
  onCreateChoice,
  onDeleteChoice,
  onSetStartCard,
  onUploadImage,
  onDeleteCard,
  isStartCard,
}: InspectorProps) {
  const [caption, setCaption] = useState(card?.caption || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCaption(card?.caption || '');
  }, [card]);

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCaption = e.target.value;
      setCaption(newCaption);
      if (card) {
        onUpdateCard(card.id, { caption: newCaption });
      }
    },
    [card, onUpdateCard]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (card && e.target.files && e.target.files.length > 0) {
        onUploadImage(card.id, e.target.files[0]);
      }
    },
    [card, onUploadImage]
  );

  const handleAddChoice = useCallback(() => {
    if (card) {
      const cardChoices = choices.filter((c) => c.cardId === card.id);
      const maxOrder =
        cardChoices.length > 0
          ? Math.max(...cardChoices.map((c) => c.order))
          : -1;
      onCreateChoice(card.id, 'New Choice', null, maxOrder + 1);
    }
  }, [card, choices, onCreateChoice]);

  const cardChoices = useMemo(() => {
    return choices
      .filter((c) => c.cardId === card?.id)
      .sort((a, b) => a.order - b.order);
  }, [card, choices]);

  if (!card) {
    return (
      <div className="w-80 bg-gray-100 p-4 border-l border-gray-200 flex-shrink-0">
        <p className="text-gray-500 text-sm">Select a card to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white p-4 border-l border-gray-200 flex-shrink-0 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Card Inspector</h2>

      <div className="mb-4">
        <label htmlFor="cardCaption" className="block text-sm font-medium text-gray-700 mb-1">
          Caption
        </label>
        <textarea
          id="cardCaption"
          value={caption}
          onChange={handleCaptionChange}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {card.assetId && (
          <p className="text-xs text-gray-500 mt-1">Image uploaded. Upload again to replace.</p>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">Choices</h3>
        {cardChoices.length === 0 && (
          <p className="text-sm text-gray-500 mb-2">No choices yet.</p>
        )}
        {cardChoices.map((choice) => (
          <div key={choice.id} className="flex items-center gap-2 mb-2 p-2 border border-gray-200 rounded-md">
            <input
              type="text"
              value={choice.label}
              onChange={(e) => onUpdateChoice(choice.id, { label: e.target.value })}
              placeholder="Choice Label"
              className="flex-1 p-1 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={choice.targetCardId || ''}
              onChange={(e) => onUpdateChoice(choice.id, { targetCardId: e.target.value || null })}
              className="p-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">None</option>
              {allCards
                .filter((c) => c.id !== card.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caption || `Card ${c.id.slice(0, 4)}`}
                  </option>
                ))}
            </select>
            <button
              onClick={() => onDeleteChoice(choice.id)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Delete Choice"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={handleAddChoice}
          className="w-full mt-2 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
        >
          Add Choice
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">Project Settings</h3>
        <button
          onClick={() => onSetStartCard(card.id)}
          disabled={isStartCard}
          className={`w-full mb-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
            isStartCard
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {isStartCard ? 'Start Card' : 'Set as Start Card'}
        </button>
        {onDeleteCard && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this card? All inbound links will be set to null.')) {
                onDeleteCard(card.id);
              }
            }}
            className="w-full px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
          >
            Delete Card
          </button>
        )}
      </div>
    </div>
  );
}
