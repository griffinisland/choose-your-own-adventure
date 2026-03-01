'use client';

import { useParams } from 'next/navigation';
import { useProject } from '@/lib/instantdb/queries';
import { PlayerStage } from '@/components/PlayerStage';
import { QuizPlayer } from '@/components/QuizPlayer';
import { useMemo } from 'react';
import { db } from '@/lib/instantdb/client';
import { getFileUrl } from '@/lib/instantdb/storageUrl';
import type { AppSchema, QuizResultMessage } from '@/instant/schema';

type Asset = AppSchema['assets'];

export default function PlayPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { project, cards, choices, assets, sceneElements, isLoading, error } =
    useProject(projectId);

  // Query $files to get actual storage URLs (same pattern as edit page)
  const { data: filesData } = db.useQuery({
    $files: {},
  });

  // Helper functions for file URL resolution
  const fileMap = useMemo(() => {
    const map = new Map<string, any>();
    const allFiles = (filesData?.$files as any[]) || [];
    allFiles.forEach((file: any) => {
      const filePath = file.path || file.key || file.name;
      if (filePath) {
        map.set(filePath, file);
      }
    });
    return map;
  }, [filesData]);

  const cardImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    cards.forEach((card) => {
      if (card.assetId) {
        const asset = assets.find((a) => a.id === card.assetId);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file, asset.storageKey, asset.url);
          if (url) {
            imageMap[card.id] = url;
          }
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  const backgroundImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    cards.forEach((card) => {
      if (card.backgroundAssetId) {
        const asset = assets.find((a) => a.id === card.backgroundAssetId);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file, asset.storageKey, asset.url);
          if (url) {
            imageMap[card.id] = url;
          }
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  const elementImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    sceneElements.forEach((element) => {
      const asset = assets.find((a) => a.id === element.assetId);
      if (asset?.storageKey) {
        const file = fileMap.get(asset.storageKey);
        const url = getFileUrl(file, asset.storageKey, asset.url);
        if (url) {
          imageMap[element.id] = url;
        }
      }
    });
    return imageMap;
  }, [sceneElements, assets, fileMap]);

  // Quiz: ordered cards, feedback images, result messages
  const quizOrderedCards = useMemo(() => {
    if (project?.projectType !== 'quiz') return [];
    const orderJson = project.quizQuestionOrder ?? '[]';
    let order: string[] = [];
    try {
      order = JSON.parse(orderJson) as string[];
    } catch {
      return [];
    }
    return order
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c != null);
  }, [project?.projectType, project?.quizQuestionOrder, cards]);

  const correctAnswerImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    cards.forEach((card) => {
      const aid = card.correctAnswerAssetId;
      if (aid) {
        const asset = assets.find((a) => a.id === aid);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file, asset.storageKey, asset.url);
          if (url) imageMap[card.id] = url;
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  const incorrectAnswerImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    cards.forEach((card) => {
      const aid = card.incorrectAnswerAssetId;
      if (aid) {
        const asset = assets.find((a) => a.id === aid);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file, asset.storageKey, asset.url);
          if (url) imageMap[card.id] = url;
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  const quizResultMessages = useMemo((): QuizResultMessage[] => {
    const raw = (project as { quizResultMessages?: string })?.quizResultMessages;
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QuizResultMessage[];
    } catch {
      return [];
    }
  }, [project]);

  const isQuiz = project?.projectType === 'quiz';

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Loading adventure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Error loading adventure</p>
          <p className="text-gray-400">{String(error)}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Adventure not found</p>
          <p className="text-gray-400">
            This adventure doesn't exist or isn't published.
          </p>
        </div>
      </div>
    );
  }

  if (!project.isPublished) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Adventure not published</p>
          <p className="text-gray-400">
            This adventure is not available for play.
          </p>
        </div>
      </div>
    );
  }

  if (isQuiz) {
    return (
      <QuizPlayer
        orderedCards={quizOrderedCards as AppSchema['cards'][]}
        choices={choices.filter((ch) =>
          cards.some((c) => c.id === ch.cardId)
        ) as AppSchema['choices'][]}
        cardImages={cardImages}
        correctAnswerImages={correctAnswerImages}
        incorrectAnswerImages={incorrectAnswerImages}
        resultMessages={quizResultMessages}
      />
    );
  }

  return (
    <PlayerStage
      cards={cards as AppSchema['cards'][]}
      choices={choices.filter((ch) =>
        cards.some((c) => c.id === ch.cardId)
      ) as AppSchema['choices'][]}
      sceneElements={(sceneElements || []) as AppSchema['sceneElements'][]}
      startCardId={project.startCardId ?? null}
      cardImages={cardImages}
      backgroundImages={backgroundImages}
      elementImages={elementImages}
    />
  );
}
