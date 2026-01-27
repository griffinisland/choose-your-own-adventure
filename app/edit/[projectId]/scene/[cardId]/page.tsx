'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/instantdb/client';
import { useProjectForEdit } from '@/lib/instantdb/queries';
import { useAuth } from '@/lib/auth/authContext';
import { canEditProject } from '@/lib/auth/utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SceneBuilder } from '@/components/editor/SceneBuilder';
import { updateCard, createAsset, updateAsset } from '@/lib/instantdb/mutations';
import Link from 'next/link';
import type { AppSchema } from '@/instant/schema';

export default function SceneBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const cardId = params?.cardId as string;
  const { user } = useAuth();
  const { project, cards, assets, sceneElements, isLoading } =
    useProjectForEdit(projectId);

  // Query $files to get actual storage URLs
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

  const card = (cards || []).find((c) => c.id === cardId);

  const handleUploadBackground = async (cardId: string, file: File) => {
    try {
      // Always create a new asset with a unique storage key to ensure each card has its own background
      const timestamp = Date.now();
      const storageKey = `projects/${projectId}/scenes/${cardId}/background/${timestamp}_${file.name}`;
      await db.storage.uploadFile(storageKey, file);
      
      const url = '';

      // Always create a new asset (don't update existing) to ensure each card has its own unique asset
      const assetId = await createAsset(projectId, storageKey, url, {
        contentType: file.type || undefined,
        bytes: file.size || undefined,
      });
      
      // Update the card with the new backgroundAssetId
      await updateCard(cardId, { backgroundAssetId: assetId });
    } catch (error) {
      console.error('Failed to upload background:', error);
      alert('Failed to upload background. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <p>Loading scene builder...</p>
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

  if (!canEditProject(user, project.ownerId)) {
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

  if (!card) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Card Not Found
          </h1>
          <Link
            href={`/edit/${projectId}`}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Return to Editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full h-screen flex flex-col bg-gray-50">
        {/* Header with Save & Exit */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href={`/edit/${projectId}`}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Editor
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">
              Scene Builder: {card.caption || 'Untitled Card'}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/edit/${projectId}`)}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Save & Exit
          </button>
        </div>

        {/* Full-screen Scene Builder */}
        <div className="flex-1 overflow-hidden">
          <SceneBuilder
            card={card as AppSchema['cards']}
            projectId={projectId}
            allCards={(cards || []) as AppSchema['cards'][]}
            sceneElements={(sceneElements || []) as AppSchema['sceneElements'][]}
            assets={(assets || []) as AppSchema['assets'][]}
            backgroundImageUrl={backgroundImages[card.id] || null}
            elementImageUrls={elementImages}
            onBackgroundUpload={handleUploadBackground}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
