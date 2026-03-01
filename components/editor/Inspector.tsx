'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { AppSchema, QuizResultMessage } from '@/instant/schema';
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
  onUpdateProject?: (projectId: string, updates: Partial<AppSchema['projects']>) => Promise<void>;
  onUploadCorrectAnswerImage?: (cardId: string, file: File) => Promise<void>;
  onUploadIncorrectAnswerImage?: (cardId: string, file: File) => Promise<void>;
  isStartCard: boolean;
  projectType?: 'adventure' | 'quiz';
  quizQuestionOrder?: string;
  quizResultMessages?: string;
  correctAnswerImageUrl?: string | null;
  incorrectAnswerImageUrl?: string | null;
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
  onUpdateProject,
  onUploadCorrectAnswerImage,
  onUploadIncorrectAnswerImage,
  isStartCard,
  projectType = 'adventure',
  quizQuestionOrder = '[]',
  quizResultMessages = '[]',
  correctAnswerImageUrl = null,
  incorrectAnswerImageUrl = null,
}: InspectorProps) {
  const router = useRouter();
  const [caption, setCaption] = useState(card?.caption || '');
  const captionEditableRef = useRef<HTMLDivElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [colorPickerRect, setColorPickerRect] = useState<{ top: number; left: number } | null>(null);
  const correctAnswerInputRef = useRef<HTMLInputElement>(null);
  const incorrectAnswerInputRef = useRef<HTMLInputElement>(null);

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
      <h2 className="text-lg font-semibold p-4 pb-2">
        {projectType === 'quiz' ? 'Quiz Question Inspector' : 'Card Inspector'}
      </h2>

      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
      <div className="mb-4">
        <label htmlFor="cardCaption" className="block text-sm font-medium text-gray-700 mb-1">
          {projectType === 'quiz' ? 'Question' : 'Caption'}
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
        <h3 className="text-md font-medium text-gray-700 mb-2">Answer choices</h3>
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
            {projectType !== 'quiz' && (
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
            )}
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

      {projectType === 'quiz' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Correct answer</label>
          {cardChoices.length === 0 ? (
            <p className="text-sm text-gray-500">Add choices below first.</p>
          ) : (
            <div className="space-y-1">
              {cardChoices.map((ch) => (
                <label key={ch.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctChoice"
                    checked={(ch as Choice & { isCorrect?: boolean }).isCorrect === true}
                    onChange={() => {
                      cardChoices.forEach((c) => {
                        onUpdateChoice(c.id, { isCorrect: c.id === ch.id });
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{ch.label || 'Choice'}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

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

      {projectType === 'quiz' && (
        <div className="mb-4 space-y-4">
          {/* Correct/incorrect feedback images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback images (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">When correct</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={correctAnswerInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUploadCorrectAnswerImage && card) onUploadCorrectAnswerImage(card.id, file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => correctAnswerInputRef.current?.click()}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                >
                  {correctAnswerImageUrl ? 'Change image' : 'Upload image'}
                </button>
                {correctAnswerImageUrl && (
                  <img src={correctAnswerImageUrl} alt="Correct" className="mt-1 h-16 object-cover rounded w-full" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">When incorrect</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={incorrectAnswerInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUploadIncorrectAnswerImage && card) onUploadIncorrectAnswerImage(card.id, file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => incorrectAnswerInputRef.current?.click()}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                >
                  {incorrectAnswerImageUrl ? 'Change image' : 'Upload image'}
                </button>
                {incorrectAnswerImageUrl && (
                  <img src={incorrectAnswerImageUrl} alt="Incorrect" className="mt-1 h-16 object-cover rounded w-full" />
                )}
              </div>
            </div>
          </div>
          {/* Question order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question order</label>
            {(() => {
              let order: string[] = [];
              try {
                order = JSON.parse(quizQuestionOrder || '[]');
              } catch {}
              const move = (idx: number, delta: number) => {
                const next = [...order];
                const ni = idx + delta;
                if (ni < 0 || ni >= next.length) return;
                [next[idx], next[ni]] = [next[ni], next[idx]];
                onUpdateProject?.(projectId, { quizQuestionOrder: JSON.stringify(next) });
              };
              return (
                <ul className="space-y-1 text-sm">
                  {order.map((cardId, idx) => {
                    const c = allCards.find((x) => x.id === cardId);
                    return (
                      <li key={cardId} className="flex items-center gap-2 p-1 border border-gray-200 rounded">
                        <span className="flex-1 truncate">{stripHtml(c?.caption ?? '') || cardId.slice(0, 8)}</span>
                        <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 text-gray-600 disabled:opacity-40">↑</button>
                        <button type="button" onClick={() => move(idx, 1)} disabled={idx === order.length - 1} className="p-0.5 text-gray-600 disabled:opacity-40">↓</button>
                      </li>
                    );
                  })}
                  {order.length === 0 && <p className="text-gray-500 text-xs">Add cards; they are added to the quiz order automatically.</p>}
                </ul>
              );
            })()}
          </div>
          {/* Result messages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Results messages (by % score)</label>
            {(() => {
              let messages: QuizResultMessage[] = [];
              try {
                messages = JSON.parse(quizResultMessages || '[]');
              } catch {}
              const update = (next: QuizResultMessage[]) => {
                onUpdateProject?.(projectId, { quizResultMessages: JSON.stringify(next) });
              };
              return (
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 items-center flex-wrap p-2 border border-gray-200 rounded text-sm">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={msg.minPercent}
                        onChange={(e) => {
                          const next = [...messages];
                          next[idx] = { ...next[idx], minPercent: Number(e.target.value) };
                          update(next);
                        }}
                        className="w-14 p-1 border rounded"
                        placeholder="Min %"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={msg.maxPercent}
                        onChange={(e) => {
                          const next = [...messages];
                          next[idx] = { ...next[idx], maxPercent: Number(e.target.value) };
                          update(next);
                        }}
                        className="w-14 p-1 border rounded"
                        placeholder="Max %"
                      />
                      <input
                        type="text"
                        value={msg.message}
                        onChange={(e) => {
                          const next = [...messages];
                          next[idx] = { ...next[idx], message: e.target.value };
                          update(next);
                        }}
                        className="flex-1 min-w-0 p-1 border rounded"
                        placeholder="Message"
                      />
                      <button type="button" onClick={() => update(messages.filter((_, i) => i !== idx))} className="text-red-600 p-1">✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update([...messages, { minPercent: 0, maxPercent: 100, message: '' }])}
                    className="text-sm text-blue-600"
                  >
                    + Add message
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">Project Settings</h3>
        {projectType !== 'quiz' && (
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
        )}
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
