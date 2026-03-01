'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import type { AppSchema, QuizResultMessage } from '@/instant/schema';
import { stripHtml } from '@/lib/utils';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

const POINTS_PER_CORRECT = 10;

interface QuizPlayerProps {
  orderedCards: Card[];
  choices: Choice[];
  cardImages: Record<string, string>;
  correctAnswerImages: Record<string, string>;
  incorrectAnswerImages: Record<string, string>;
  resultMessages: QuizResultMessage[];
  onPlayAgain?: () => void;
}

export function QuizPlayer({
  orderedCards,
  choices,
  cardImages,
  correctAnswerImages,
  incorrectAnswerImages,
  resultMessages,
  onPlayAgain,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const totalQuestions = orderedCards.length;
  const currentCard = totalQuestions > 0 ? orderedCards[currentIndex] : null;
  const currentChoices = currentCard
    ? choices.filter((ch) => ch.cardId === currentCard.id).sort((a, b) => a.order - b.order)
    : [];

  const handleAnswer = useCallback(
    (choice: Choice) => {
      const isCorrect = choice.isCorrect === true;
      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);
      if (isCorrect) {
        setScore((s) => s + POINTS_PER_CORRECT);
      }
      setAnswers((a) => [...a, isCorrect]);
    },
    []
  );

  const handleNext = useCallback(() => {
    setShowFeedback(false);
    if (currentIndex + 1 >= totalQuestions) {
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setShowResults(false);
    setAnswers([]);
    onPlayAgain?.();
  }, [onPlayAgain]);

  // Results view
  if (showResults && totalQuestions > 0) {
    const correctCount = answers.filter(Boolean).length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const messageRow = resultMessages.find(
      (m) => percentage >= m.minPercent && percentage <= m.maxPercent
    );
    const message = messageRow?.message ?? 'Quiz complete!';

    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
          <p className="text-lg text-gray-700">
            You got <strong>{correctCount}</strong> out of <strong>{totalQuestions}</strong> correct.
          </p>
          <p className="text-lg text-gray-600">Score: {score} points</p>
          <p className="text-xl font-medium text-gray-800">{message}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={handlePlayAgain}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Play again
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No questions
  if (!currentCard || totalQuestions === 0) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <p className="text-xl">This quiz has no questions yet.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = cardImages[currentCard.id] || null;
  const correctImageUrl = correctAnswerImages[currentCard.id] || null;
  const incorrectImageUrl = incorrectAnswerImages[currentCard.id] || null;
  const correctChoiceLabel = currentChoices.find((ch) => ch.isCorrect === true)?.label ?? '';

  // Feedback overlay (after answering)
  if (showFeedback) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <div className="px-4 py-2 bg-gray-100 border-b flex justify-between items-center">
          <span className="font-semibold text-gray-700">Score: {score}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {feedbackCorrect ? (
            <>
              <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-lg text-xl font-medium mb-4">
                Correct!
              </div>
              {correctImageUrl && (
                <img
                  src={correctImageUrl}
                  alt="Correct"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
                />
              )}
            </>
          ) : (
            <>
              <div className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-lg text-xl font-medium mb-4">
                Incorrect
              </div>
              {incorrectImageUrl && (
                <img
                  src={incorrectImageUrl}
                  alt="Incorrect"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
                />
              )}
              {correctChoiceLabel && (
                <p className="mt-4 text-lg text-gray-700">
                  The correct answer was: <strong>{correctChoiceLabel}</strong>
                </p>
              )}
            </>
          )}
          <button
            onClick={handleNext}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {currentIndex + 1 >= totalQuestions ? 'See results' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <div className="px-4 py-2 bg-gray-100 border-b flex justify-between items-center">
        <span className="font-semibold text-gray-700">Score: {score}</span>
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Question image */}
        <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 min-h-[200px] max-h-[40vh]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={stripHtml(currentCard.caption) || 'Question'}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400">No image</div>
          )}
        </div>

        {/* Question text and answers */}
        <div className="flex-1 px-6 py-6 flex flex-col gap-6">
          {currentCard.caption && (
            <div
              className="w-full max-w-4xl mx-auto text-lg leading-relaxed text-gray-900 [&_b]:font-bold [&_i]:italic"
              dangerouslySetInnerHTML={{ __html: currentCard.caption }}
            />
          )}
          {currentChoices.length > 0 && (
            <div className="w-full max-w-4xl mx-auto flex flex-wrap gap-4 justify-center">
              {currentChoices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleAnswer(choice)}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-md shadow-md transition-colors duration-200 min-w-[120px]"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
