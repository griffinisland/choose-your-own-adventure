'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { usePublishedProjects } from '@/lib/instantdb/queries';
import { db } from '@/lib/instantdb/client';
import { updateProject, deleteProject, createAsset, createCard, updateCard, updateAsset, deleteAsset } from '@/lib/instantdb/mutations';
import { useAuth } from '@/lib/auth/authContext';
import { canEditProject } from '@/lib/auth/utils';
import type { AppSchema } from '@/instant/schema';

type Project = AppSchema['projects'];
type Card = AppSchema['cards'];
type Asset = AppSchema['assets'];

// Recommended thumbnail dimensions: 1280x720 (16:9 aspect ratio)
const THUMBNAIL_MAX_SIZE = 500 * 1024; // 500KB
const THUMBNAIL_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Helper to get URL from InstantDB $files object
// InstantDB files have: id, path, content-type, location-id, etc.
// The download URL needs to be constructed
function getFileUrl(file: any, appId: string | undefined): string | null {
  if (!file || !appId) return null;
  
  // Check if file has a direct URL field
  if (file.url) return file.url;
  if (file.src) return file.src;
  if (file.downloadUrl) return file.downloadUrl;
  
  // Construct URL from file path
  // InstantDB storage URL format: https://storage.instantdb.com/{appId}/{path}
  const filePath = file.path || file.key;
  if (filePath) {
    return `https://storage.instantdb.com/${appId}/${filePath}`;
  }
  
  return null;
}

// Helper to construct InstantDB storage URL from storage key
function getStorageUrl(storageKey: string): string | null {
  if (!storageKey) return null;
  
  const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  if (!appId) {
    console.warn('NEXT_PUBLIC_INSTANT_APP_ID not set, cannot construct storage URL');
    return null;
  }
  
  // If storageKey already looks like a URL, return it
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  
  // Construct URL: https://storage.instantdb.com/{appId}/{path}
  return `https://storage.instantdb.com/${appId}/${storageKey}`;
}

function getThumbnailUrl(
  project: Project,
  cards: Card[],
  assets: Asset[],
  fileMap: Map<string, any>
): string | null {
  // Helper to check if a string is a valid InstantDB URL
  // ONLY accept URLs from instant-storage.s3.amazonaws.com (the correct domain)
  const isValidInstantDbUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    return url.includes('instant-storage.s3.amazonaws.com');
  };

  // Helper to get URL from $files query (the ONLY reliable source)
  const getUrlFromFileMap = (storageKey: string): string | null => {
    if (!storageKey) return null;
    const file = fileMap.get(storageKey);
    if (!file) return null;
    // Check file object for URL properties
    if (file.url && isValidInstantDbUrl(file.url)) return file.url;
    if (file.src && isValidInstantDbUrl(file.src)) return file.src;
    if (file.downloadUrl && isValidInstantDbUrl(file.downloadUrl)) return file.downloadUrl;
    return null;
  };

  // Helper to get URL for an asset - ALWAYS prefer fileMap over stored asset.url
  const getAssetUrl = (asset: Asset): string | null => {
    // First, try to get the URL from $files using storageKey (the CORRECT source)
    const fileUrl = getUrlFromFileMap(asset.storageKey);
    if (fileUrl) return fileUrl;
    
    // Only use asset.url if it's from the correct domain
    // (old assets might have wrong domain stored)
    if (isValidInstantDbUrl(asset.url)) return asset.url;
    
    return null;
  };

  // Strategy 1: Use thumbnailCardId if set
  if (project.thumbnailCardId) {
    const thumbCard = cards.find((c) => c.id === project.thumbnailCardId);
    if (thumbCard?.assetId) {
      const asset = assets.find((a) => a.id === thumbCard.assetId);
      if (asset) {
        const url = getAssetUrl(asset);
        if (url) return url;
      }
    }
  }

  // Strategy 2: Find any asset with a valid URL
  for (const asset of assets) {
    const url = getAssetUrl(asset);
    if (url) return url;
  }

  // Strategy 3: Use first card's asset
  const firstCard = cards[0];
  if (firstCard?.assetId) {
    const asset = assets.find((a) => a.id === firstCard.assetId);
    if (asset) {
      const url = getAssetUrl(asset);
      if (url) return url;
    }
  }

  return null;
}

function EditableTitle({ 
  project, 
  isOwner, 
  onUpdate 
}: { 
  project: Project; 
  isOwner: boolean;
  onUpdate: (title: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setTitle(project.title);
  };

  const handleSave = async () => {
    if (title.trim() === '') {
      setTitle(project.title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(title.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(project.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOwner) {
    return (
      <h3 className="text-lg font-semibold mb-3 truncate">
        {project.title}
      </h3>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          {isSaving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Cancel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-lg font-semibold truncate flex-1">
        {project.title}
      </h3>
      <button
        onClick={handleEdit}
        className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="Edit title"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}

function ThumbnailUploader({
  project,
  isOwner,
  onUpload,
  thumbnailUrl,
}: {
  project: Project;
  isOwner: boolean;
  onUpload: (file: File) => Promise<void>;
  thumbnailUrl: string | null;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!THUMBNAIL_ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image file.');
      return;
    }

    // Validate file size
    if (file.size > THUMBNAIL_MAX_SIZE) {
      alert(`File size must be less than ${THUMBNAIL_MAX_SIZE / 1024}KB (${(THUMBNAIL_MAX_SIZE / 1024 / 1024).toFixed(1)}MB). Your file is ${(file.size / 1024).toFixed(1)}KB.`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      console.log('Upload completed successfully');
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="aspect-video bg-gray-100 relative group"
      onMouseEnter={() => isOwner && setIsHovered(true)}
      onMouseLeave={() => isOwner && !isUploading && setIsHovered(false)}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={project.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', thumbnailUrl);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}
      
      {/* File input is ALWAYS mounted so it doesn't get removed when hover ends */}
      {isOwner && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          disabled={isUploading}
        />
      )}
      
      {isOwner && (isHovered || isUploading) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          {isUploading ? (
            <div className="text-white">
              <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm">Uploading...</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleButtonClick}
              className="px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-colors font-medium cursor-pointer"
            >
              Upload Image
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GalleryGrid() {
  const { projects: rawProjects, isLoading } = usePublishedProjects();
  const { user } = useAuth();
  const [localThumbs, setLocalThumbs] = useState<Record<string, string>>({});

  const { data } = db.useQuery({
    cards: {},
    choices: {}, // Need choices to delete them when deleting a project
    assets: {},
    $files: {}, // Query files to get actual storage URLs
  });

  const projects = (rawProjects || []) as Project[];
  const allCards = data?.cards || [];
  const allChoices = data?.choices || [];
  const allAssets = data?.assets || [];
  const allFiles = (data?.$files as any[]) || [];
  
  const projectIds = new Set(projects.map((p) => p.id));
  const cards = allCards.filter((c) => projectIds.has(c.projectId));
  const assets = allAssets.filter((a) => projectIds.has(a.projectId));
  
  // Filter choices to only those belonging to cards in published projects
  const cardIds = new Set(cards.map((c) => c.id));
  const choices = allChoices.filter((ch) => cardIds.has(ch.cardId));
  
  // Create a map of storageKey (path) -> file object
  // InstantDB $files uses 'path' field to store the storage key
  const fileMap = new Map<string, any>();
  allFiles.forEach((file: any) => {
    // Try both 'path' and other possible field names
    const filePath = file.path || file.key || file.name;
    if (filePath) {
      fileMap.set(filePath, file);
    }
  });
  

  const handleUpdateTitle = async (projectId: string, newTitle: string) => {
    await updateProject(projectId, { title: newTitle });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all related data for this project (we already have it from queries)
      const projectCards = cards.filter((c) => c.projectId === projectId);
      const projectAssets = assets.filter((a) => a.projectId === projectId);
      
      // Get all choices that belong to cards in this project
      const cardIds = new Set(projectCards.map((c) => c.id));
      const projectChoices = choices.filter((ch) => cardIds.has(ch.cardId));
      
      await deleteProject(projectId, projectCards, projectChoices, projectAssets);
    } catch (error) {
      console.error('Failed to delete project:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to delete project: ${errorMessage}\n\nCheck the browser console for details.`);
    }
  };

  const handleThumbnailUpload = async (projectId: string, file: File) => {
    try {
      // Local preview so user sees the image immediately
      const objectUrl = URL.createObjectURL(file);
      setLocalThumbs((prev) => ({ ...prev, [projectId]: objectUrl }));

      // Use UNIQUE storage key with timestamp
      // This ensures each upload creates a new file, avoiding overwrite issues
      const timestamp = Date.now();
      const storageKey = `projects/${projectId}/thumbnail_${timestamp}_${file.name}`;
      
      // Upload to InstantDB storage
      await db.storage.uploadFile(storageKey, file);
      
      // NOTE: We don't construct a URL here. The correct URL comes from the $files query
      // which returns signed S3 URLs from instant-storage.s3.amazonaws.com
      // We store an empty string as a placeholder since the url field is required
      const url = '';  // URL will be retrieved from $files at display time

      // Get cards that ACTUALLY belong to this project
      const projectCards = cards.filter((c) => c.projectId === projectId);
      const currentProject = projects.find((p) => p.id === projectId);
      
      // CRITICAL: Verify the thumbnailCardId actually exists in projectCards
      // The stored thumbnailCardId might be stale (pointing to a deleted card or card from another project)
      const existingThumbnailCard = projectCards.find((c) => c.id === currentProject?.thumbnailCardId);
      let thumbnailCardId: string;
      
      if (existingThumbnailCard) {
        // Valid thumbnailCardId - use it
        thumbnailCardId = existingThumbnailCard.id;
      } else if (projectCards.length > 0) {
        // thumbnailCardId is invalid/stale, use first project card instead
        thumbnailCardId = projectCards[0].id;
      } else {
        // No cards exist - create a new one
        thumbnailCardId = await createCard(projectId, 0, 0);
        // Wait a moment for the card to be created in the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // ALWAYS create a new asset (simpler and more reliable)
      const assetId = await createAsset(projectId, storageKey, url, {
        contentType: file.type || undefined,
        bytes: file.size || undefined,
      });
      
      // Update the card to use this new asset
      await updateCard(thumbnailCardId, { assetId });

      // Set/update the thumbnailCardId on the project
      await updateProject(projectId, { thumbnailCardId });

    } catch (error) {
      // Clean up local preview on error
      setLocalThumbs((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      console.error('[handleThumbnailUpload] Failed:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-gray-500 text-lg mb-4">No published projects yet.</p>
        {user && (
          <p className="text-sm text-gray-500">
            Use the "New Project" button above to create your first project.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {projects.map((project) => {
        const projectCards = cards.filter((c) => c.projectId === project.id);
        const projectAssets = assets.filter((a) => a.projectId === project.id);
        const thumbnailUrl =
          localThumbs[project.id] || getThumbnailUrl(project, projectCards as Card[], projectAssets as Asset[], fileMap);
        const isOwner = canEditProject(user, project.ownerId);

        return (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <ThumbnailUploader
              project={project}
              isOwner={isOwner}
              onUpload={(file) => handleThumbnailUpload(project.id, file)}
              thumbnailUrl={thumbnailUrl}
            />
            <div className="p-4">
              <EditableTitle
                project={project}
                isOwner={isOwner}
                onUpdate={(title) => handleUpdateTitle(project.id, title)}
              />
              <div className="flex gap-2">
                <Link
                  href={`/play/${project.id}`}
                  className="flex-1 px-3 py-2 bg-green-500 text-white text-center rounded-md hover:bg-green-600 transition-colors"
                >
                  Play
                </Link>
                {isOwner ? (
                  <>
                    <Link
                      href={`/edit/${project.id}`}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-center rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      title="Delete project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-500 text-center rounded-md cursor-not-allowed"
                    title="Sign in to edit your projects"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
