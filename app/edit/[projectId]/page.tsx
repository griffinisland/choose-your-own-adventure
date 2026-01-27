'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/instantdb/client';
import { useProjectForEdit } from '@/lib/instantdb/queries';
import { useAuth } from '@/lib/auth/authContext';
import { canEditProject } from '@/lib/auth/utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  updateCard,
  createChoice,
  updateChoice,
  deleteChoice,
  updateProject,
  deleteCard,
  createAsset,
  updateAsset,
  createCard,
  duplicateCard,
} from '@/lib/instantdb/mutations';
import { FlowCanvas } from '@/components/editor/FlowCanvas';
import { Inspector } from '@/components/editor/Inspector';
import { downloadProject } from '@/lib/importExport/exportProject';
import { EditableTitle } from '@/components/EditableTitle';
import Link from 'next/link';
import type { AppSchema } from '@/instant/schema';

type Asset = AppSchema['assets'];

export default function EditPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { project, cards, choices, assets, sceneElements, isLoading } =
    useProjectForEdit(projectId);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Query $files to get actual storage URLs (same pattern as thumbnails)
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

  const isValidInstantDbUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.includes('instant-storage.s3.amazonaws.com');
  };

  const getFileUrl = (file: any): string | null => {
    if (!file) return null;
    if (file.url && isValidInstantDbUrl(file.url)) return file.url;
    if (file.src && isValidInstantDbUrl(file.src)) return file.src;
    if (file.downloadUrl && isValidInstantDbUrl(file.downloadUrl)) return file.downloadUrl;
    return null;
  };

  const cardImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    (cards || []).forEach((card) => {
      if (card.assetId) {
        const asset = (assets || []).find((a) => a.id === card.assetId);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file);
          if (url) {
            imageMap[card.id] = url;
          }
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  // Background images for cards
  // Fall back to card.assetId (old images) if backgroundAssetId is not set
  const backgroundImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    (cards || []).forEach((card) => {
      // First try backgroundAssetId (new scene builder images)
      let assetId = card.backgroundAssetId;
      // If no backgroundAssetId, fall back to assetId (old card images)
      if (!assetId && card.assetId) {
        assetId = card.assetId;
      }
      
      if (assetId) {
        const asset = (assets || []).find((a) => a.id === assetId);
        if (asset?.storageKey) {
          const file = fileMap.get(asset.storageKey);
          const url = getFileUrl(file);
          if (url) {
            imageMap[card.id] = url;
          }
        }
      }
    });
    return imageMap;
  }, [cards, assets, fileMap]);

  // Element images for scene elements
  const elementImages = useMemo(() => {
    const imageMap: Record<string, string> = {};
    (sceneElements || []).forEach((element) => {
      const asset = (assets || []).find((a) => a.id === element.assetId);
      if (asset?.storageKey) {
        const file = fileMap.get(asset.storageKey);
        const url = getFileUrl(file);
        if (url) {
          imageMap[element.id] = url;
        }
      }
    });
    return imageMap;
  }, [sceneElements, assets, fileMap]);

  const selectedCard = (cards || []).find((c) => c.id === selectedCardId) || null;
  const isStartCard = project?.startCardId === selectedCardId;

  // Auto-select first card if none selected and cards exist
  useEffect(() => {
    if (!selectedCardId && cards && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const handleUpdateCard = useCallback(
    async (cardId: string, updates: Partial<AppSchema['cards']>) => {
      await updateCard(cardId, updates);
    },
    []
  );

  const handleUpdateChoice = useCallback(
    async (choiceId: string, updates: Partial<AppSchema['choices']>) => {
      await updateChoice(choiceId, updates);
    },
    []
  );

  const handleCreateChoice = useCallback(
    async (
      cardId: string,
      label: string,
      targetCardId: string | null,
      order: number
    ) => {
      await createChoice(cardId, label, targetCardId, order);
    },
    []
  );

  const handleDeleteChoice = useCallback(async (choiceId: string) => {
    await deleteChoice(choiceId);
  }, []);

  const handleSetStartCard = useCallback(
    async (cardId: string) => {
      await updateProject(projectId, { startCardId: cardId });
    },
    [projectId]
  );

  const handleUploadImage = useCallback(
    async (cardId: string, file: File) => {
      try {
        // Use unique storage key with timestamp to avoid caching issues
        const timestamp = Date.now();
        const storageKey = `projects/${projectId}/cards/${cardId}/${timestamp}_${file.name}`;
        await db.storage.uploadFile(storageKey, file);
        
        // NOTE: We don't construct a URL here. The correct URL comes from the $files query
        // which returns signed S3 URLs from instant-storage.s3.amazonaws.com
        const url = '';  // URL will be retrieved from $files at display time

        // Check if card already has an asset (for replacement)
        const currentCard = (cards || []).find((c) => c.id === cardId);
        if (currentCard?.assetId) {
          await updateAsset(currentCard.assetId, {
            storageKey,
            url,
            contentType: file.type || undefined,
            bytes: file.size || undefined,
          });
        } else {
          const assetId = await createAsset(projectId, storageKey, url, {
            contentType: file.type || undefined,
            bytes: file.size || undefined,
          });
          await updateCard(cardId, { assetId });
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      }
    },
    [projectId, cards]
  );


  const handleExport = useCallback(() => {
    if (!project) return;
    downloadProject(
      project as AppSchema['projects'],
      (cards || []) as AppSchema['cards'][],
      (choices || []) as AppSchema['choices'][],
      (sceneElements || []) as AppSchema['sceneElements'][],
      (assets || []) as AppSchema['assets'][]
    );
  }, [project, cards, choices, sceneElements, assets]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        const { importProject } = await import('@/lib/importExport/importProject');
        const { projectId: newProjectId } = await importProject(importData, user.username);
        
        router.push(`/edit/${newProjectId}`);
      } catch (error) {
        console.error('Failed to import:', error);
        alert('Failed to import project. Please check the file format.');
      }
    },
    [user, router]
  );

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      if (
        !confirm(
          'Are you sure you want to delete this card? All inbound links will be set to null.'
        )
      ) {
        return;
      }

      try {
        await deleteCard(cardId, projectId);
        if (selectedCardId === cardId) {
          setSelectedCardId(null);
        }
      } catch (error) {
        console.error('Failed to delete card:', error);
        alert('Failed to delete card. Please try again.');
      }
    },
    [projectId, selectedCardId]
  );

  const handleUpdateProjectTitle = useCallback(
    async (newTitle: string) => {
      await updateProject(projectId, { title: newTitle });
    },
    [projectId]
  );

  const handleAddCard = useCallback(async () => {
    try {
      const cardCount = (cards || []).length;
      // Position new card to the right of existing cards
      // Calculate max X position and add 300px spacing
      const maxX = cards && cards.length > 0
        ? Math.max(...cards.map((c) => c.positionX))
        : 0;
      const newX = maxX + 300;
      const newCardId = await createCard(projectId, newX, 0);
      setSelectedCardId(newCardId);
    } catch (error) {
      console.error('Failed to create card:', error);
      alert('Failed to create card. Please try again.');
    }
  }, [projectId, cards]);

  const handleDuplicateCard = useCallback(
    async (cardId: string) => {
      try {
        const newCardId = await duplicateCard(cardId, projectId);
        setSelectedCardId(newCardId);
      } catch (error) {
        console.error('Failed to duplicate card:', error);
        alert('Failed to duplicate card. Please try again.');
      }
    },
    [projectId]
  );

  const handleNodeDragStop = useCallback(
    async (cardId: string, x: number, y: number) => {
      await updateCard(cardId, { positionX: x, positionY: y });
    },
    []
  );

  const handleConnect = useCallback(
    async (sourceCardId: string, targetCardId: string, choiceId?: string) => {
      if (choiceId) {
        // Connection from a choice node to a card
        await updateChoice(choiceId, { targetCardId });
      } else {
        // Connection from card to card (fallback - create a new choice)
        // Find the first choice without a target, or create a new one
        const cardChoices = (choices || []).filter((c) => c.cardId === sourceCardId);
        const emptyChoice = cardChoices.find((c) => !c.targetCardId);
        
        if (emptyChoice) {
          await updateChoice(emptyChoice.id, { targetCardId });
        } else {
          // Create a new choice
          const maxOrder = cardChoices.length > 0
            ? Math.max(...cardChoices.map((c) => c.order))
            : -1;
          await createChoice(sourceCardId, 'New Choice', targetCardId, maxOrder + 1);
        }
      }
    },
    [choices, updateChoice, createChoice]
  );

  const handleDeleteEdge = useCallback(
    async (choiceId: string) => {
      // Break the connection by setting targetCardId to null
      await updateChoice(choiceId, { targetCardId: null });
    },
    [updateChoice]
  );

  if (!isLoading && project && !canEditProject(user, project.ownerId)) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Not Authorized
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to edit this project.
          </p>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <p>Loading editor...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Project Not Found
          </h1>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            ← Gallery
          </Link>
          <EditableTitle
            title={project.title}
            onUpdate={handleUpdateProjectTitle}
            headingLevel="h1"
            className="text-lg font-semibold text-gray-900"
          />
          <button
            onClick={handleAddCard}
            className="ml-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Add Card
          </button>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/play/${projectId}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Preview
          </a>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Export JSON
          </button>
          <label className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Flow Canvas */}
        <div className="flex-1 border-r border-gray-200 bg-gray-50">
          <FlowCanvas
            cards={(cards || []) as AppSchema['cards'][]}
            choices={(choices || []) as AppSchema['choices'][]}
            cardImages={cardImages}
            backgroundImages={backgroundImages}
            sceneElements={(sceneElements || []) as AppSchema['sceneElements'][]}
            elementImages={elementImages}
            onNodeDragStop={handleNodeDragStop}
            onConnect={handleConnect}
            onNodeClick={setSelectedCardId}
            onDeleteEdge={handleDeleteEdge}
            selectedCardId={selectedCardId}
          />
        </div>

        {/* Inspector Sidebar */}
        <Inspector
          card={selectedCard as AppSchema['cards'] | null}
          allCards={(cards || []) as AppSchema['cards'][]}
          choices={(choices || []) as AppSchema['choices'][]}
          sceneElements={(sceneElements || []) as AppSchema['sceneElements'][]}
          assets={(assets || []) as AppSchema['assets'][]}
          backgroundImageUrl={selectedCard ? backgroundImages[selectedCard.id] || null : null}
          elementImageUrls={elementImages}
          projectId={projectId}
          onUpdateCard={handleUpdateCard}
          onUpdateChoice={handleUpdateChoice}
          onCreateChoice={handleCreateChoice}
          onDeleteChoice={handleDeleteChoice}
          onSetStartCard={handleSetStartCard}
          onDuplicateCard={handleDuplicateCard}
          onDeleteCard={handleDeleteCard}
          isStartCard={isStartCard}
        />
      </div>
    </div>
    </ProtectedRoute>
  );
}
