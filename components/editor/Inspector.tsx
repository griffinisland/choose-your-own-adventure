'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { AppSchema } from '@/instant/schema';
import { stripHtml } from '@/lib/utils';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type SceneElement = AppSchema['sceneElements'];
type Asset = AppSchema['assets'];

/** Caption text colors with tooltip names (for rich text color picker) */
const CAPTION_COLORS: { name: string; hex: string }[] = [
  { name: 'Default', hex: '#4A4A4A' },
  { name: 'Light Gray', hex: '#9CA3AF' },
  { name: 'Soft Red', hex: '#E24A4A' },
  { name: 'Watermelon Pink', hex: '#F26D7D' },
  { name: 'Bubblegum Pink', hex: '#F4A3C0' },
  { name: 'Tangerine', hex: '#F28C38' },
  { name: 'Peach', hex: '#F6B38E' },
  { name: 'Golden Yellow', hex: '#F2C94C' },
  { name: 'Sunny Cream', hex: '#F7E7A1' },
  { name: 'Apple Green', hex: '#6FCF97' },
  { name: 'Mint', hex: '#9FE0C3' },
  { name: 'Grass Green', hex: '#4CAF50' },
  { name: 'Teal Green', hex: '#2FA4A9' },
  { name: 'Sky Blue', hex: '#6EC1E4' },
  { name: 'Soft Blue', hex: '#5DA9E9' },
  { name: 'Denim Blue', hex: '#3F6FB5' },
  { name: 'Deep Ocean', hex: '#2C5282' },
  { name: 'Lavender', hex: '#B9A7E8' },
  { name: 'Grape Purple', hex: '#8B6FCF' },
  { name: 'Royal Purple', hex: '#6B4EFF' },
  { name: 'Coral', hex: '#FF7A6E' },
  { name: 'Turquoise', hex: '#3DDAD7' },
  { name: 'Soft Brown', hex: '#8B5E3C' },
  { name: 'Soft Indigo', hex: '#6B6FD8' },
];

/** Caption font choices (Google Fonts); display name and CSS font-family value */
const CAPTION_FONTS: { name: string; family: string }[] = [
  { name: 'Default', family: 'inherit' },
  { name: 'Roboto', family: '"Roboto", sans-serif' },
  { name: 'Bevan', family: '"Bevan", serif' },
  { name: 'Bree Serif', family: '"Bree Serif", serif' },
  { name: 'Cherry Swash', family: '"Cherry Swash", cursive' },
  { name: 'Comic Neue', family: '"Comic Neue", cursive' },
  { name: 'Fredoka', family: '"Fredoka", sans-serif' },
  { name: 'Gelasio', family: '"Gelasio", serif' },
  { name: 'Markazi Text', family: '"Markazi Text", serif' },
  { name: 'Merriweather', family: '"Merriweather", serif' },
  { name: 'Nunito', family: '"Nunito", sans-serif' },
  { name: 'Source Sans 3', family: '"Source Sans 3", sans-serif' },
];

interface InspectorProps {
  card: Card | null;
  allCards: Card[];
  choices: Choice[];
  sceneElements: SceneElement[];
  assets: Asset[];
  backgroundImageUrl: string | null;
  elementImageUrls: Record<string, string>;
  projectId: string;
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
  onDuplicateCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  isStartCard: boolean;
}

export function Inspector({
  card,
  allCards,
  choices,
  sceneElements,
  assets,
  backgroundImageUrl,
  elementImageUrls,
  projectId,
  onUpdateCard,
  onUpdateChoice,
  onCreateChoice,
  onDeleteChoice,
  onSetStartCard,
  onDuplicateCard,
  onDeleteCard,
  isStartCard,
}: InspectorProps) {
  const router = useRouter();
  const [caption, setCaption] = useState(card?.caption || '');
  const captionEditableRef = useRef<HTMLDivElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [colorPickerRect, setColorPickerRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setCaption(card?.caption || '');
  }, [card]);

  // Sync contentEditable content only when switching cards (not on every caption update to avoid cursor jump)
  useEffect(() => {
    const el = captionEditableRef.current;
    if (!el) return;
    el.innerHTML = card?.caption ?? '';
  }, [card?.id]);

  const handleCaptionInput = useCallback(() => {
    const el = captionEditableRef.current;
    if (!el || !card) return;
    const html = el.innerHTML;
    setCaption(html);
    onUpdateCard(card.id, { caption: html });
  }, [card, onUpdateCard]);

  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value ?? undefined);
    captionEditableRef.current?.focus();
    handleCaptionInput();
  }, [handleCaptionInput]);

  const applyColor = useCallback((hex: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      document.execCommand('foreColor', false, hex);
    } else {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.color = hex;
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      selection.removeAllRanges();
    }
    handleCaptionInput();
    setColorPickerOpen(false);
  }, [handleCaptionInput]);

  const applyFont = useCallback((fontFamily: string) => {
    if (fontFamily === 'inherit') return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      document.execCommand('fontName', false, fontFamily);
    } else {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontFamily = fontFamily;
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      selection.removeAllRanges();
    }
    handleCaptionInput();
  }, [handleCaptionInput]);

  // Load Google Fonts for caption font picker (only in browser)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'caption-google-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Bevan&family=Bree+Serif&family=Cherry+Swash&family=Comic+Neue&family=Fredoka&family=Gelasio&family=Markazi+Text&family=Merriweather&family=Nunito&family=Roboto&family=Source+Sans+3&display=swap';
    document.head.appendChild(link);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  // Position color picker when opened; close when clicking outside
  useEffect(() => {
    if (!colorPickerOpen || !colorButtonRef.current) return;
    const rect = colorButtonRef.current.getBoundingClientRect();
    const pickerHeight = 110; // ~4 rows of 16px tiles + gaps + padding
    setColorPickerRect({
      left: rect.left,
      top: rect.top - pickerHeight - 4,
    });
  }, [colorPickerOpen]);

  useEffect(() => {
    if (!colorPickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (colorPickerRef.current?.contains(target) || colorButtonRef.current?.contains(target)) return;
      setColorPickerOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [colorPickerOpen]);

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
    <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col" style={{ height: '100%' }}>
      <h2 className="text-lg font-semibold p-4 pb-2">Card Inspector</h2>

      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
      <div className="mb-4">
        <label htmlFor="cardCaption" className="block text-sm font-medium text-gray-700 mb-1">
          Caption
        </label>
        {/* Rich text toolbar — positioned above caption so color picker doesn't cover it */}
        <div className="flex items-center gap-1 mb-1 flex-wrap">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 font-bold text-sm"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 italic text-sm"
            title="Italic"
          >
            I
          </button>
          <div className="relative">
            <button
              ref={colorButtonRef}
              type="button"
              onClick={() => setColorPickerOpen((v) => !v)}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 text-sm flex items-center gap-0.5"
              title="Text color"
            >
              <span className="inline-block w-4 h-4 rounded border border-gray-400" style={{ backgroundColor: '#4A4A4A' }} aria-hidden />
              A
            </button>
            {colorPickerOpen && colorPickerRect && typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={colorPickerRef}
                  className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-1 grid grid-cols-6 gap-0.5"
                  style={{
                    width: '108px',
                    left: colorPickerRect.left,
                    top: colorPickerRect.top,
                  }}
                >
                  {CAPTION_COLORS.map(({ name, hex }) => (
                    <button
                      key={hex}
                      type="button"
                      title={name}
                      className="w-4 h-4 min-w-[14px] min-h-[14px] rounded-sm border border-gray-200 hover:ring-2 hover:ring-blue-400 transition-shadow flex-shrink-0"
                      style={{ backgroundColor: hex }}
                      onClick={() => applyColor(hex)}
                    />
                  ))}
                </div>,
                document.body
              )}
          </div>
          <select
            title="Caption font"
            className="flex-1 min-w-0 max-w-[140px] p-1.5 border border-gray-300 rounded text-sm bg-white"
            defaultValue="inherit"
            onChange={(e) => {
              const family = CAPTION_FONTS[e.target.selectedIndex]?.family ?? 'inherit';
              applyFont(family);
              e.target.value = 'inherit';
            }}
          >
            {CAPTION_FONTS.map(({ name, family }) => (
              <option key={family} value={family} style={{ fontFamily: family }}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div
          ref={captionEditableRef}
          id="cardCaption"
          contentEditable
          suppressContentEditableWarning
          onInput={handleCaptionInput}
          className="w-full min-h-[72px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none"
          style={{ minHeight: '72px' }}
          data-placeholder="Enter caption..."
        />
        <style>{`
          [data-placeholder]:empty::before { content: attr(data-placeholder); color: #9ca3af; }
        `}</style>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scene Builder
        </label>
        <button
          onClick={() => router.push(`/edit/${projectId}/scene/${card.id}`)}
          className="w-full px-4 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
        >
          Enter Scene Builder
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Build interactive scenes with background images and clickable elements.
        </p>
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
                    {stripHtml(c.caption) || `Card ${c.id.slice(0, 4)}`}
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
        {onDuplicateCard && (
          <button
            onClick={() => onDuplicateCard(card.id)}
            className="w-full mb-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            Duplicate Card
          </button>
        )}
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
    </div>
  );
}
