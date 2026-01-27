'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { AppSchema } from '@/instant/schema';
import { db } from '@/lib/instantdb/client';
import {
  createSceneElement,
  updateSceneElement,
  deleteSceneElement,
  createAsset,
} from '@/lib/instantdb/mutations';

type Card = AppSchema['cards'];
type SceneElement = AppSchema['sceneElements'];
type Asset = AppSchema['assets'];

interface SceneBuilderProps {
  card: Card;
  projectId: string;
  allCards: Card[];
  sceneElements: SceneElement[];
  assets: Asset[];
  backgroundImageUrl: string | null;
  elementImageUrls: Record<string, string>;
  onBackgroundUpload: (cardId: string, file: File) => Promise<void>;
}

type ResizeHandleType =
  | 'nw' // top-left
  | 'n'  // top
  | 'ne' // top-right
  | 'e'  // right
  | 'se' // bottom-right
  | 's'  // bottom
  | 'sw' // bottom-left
  | 'w'; // left

export function SceneBuilder({
  card,
  projectId,
  allCards,
  sceneElements,
  assets,
  backgroundImageUrl,
  elementImageUrls,
  onBackgroundUpload,
}: SceneBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandleType | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [showLinkDropdown, setShowLinkDropdown] = useState<string | null>(null);

  // Store refs for element images to get actual rendered dimensions
  const elementImageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

  // Get elements for this card, sorted by zIndex (ascending for rendering - lower zIndex renders first)
  const cardElements = useMemo(() => {
    return sceneElements
      .filter((el) => el.cardId === card.id)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [sceneElements, card.id]);

  // Elements sorted descending for sidebar display (highest zIndex first = topmost layer)
  const cardElementsForSidebar = useMemo(() => {
    return [...cardElements].sort((a, b) => b.zIndex - a.zIndex);
  }, [cardElements]);

  const handleBackgroundUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && card) {
        onBackgroundUpload(card.id, file);
      }
    },
    [card, onBackgroundUpload]
  );

  const handleElementUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !card) return;

      try {
        const timestamp = Date.now();
        const storageKey = `projects/${projectId}/scenes/${card.id}/elements/${timestamp}_${file.name}`;
        await db.storage.uploadFile(storageKey, file);

        const assetId = await createAsset(projectId, storageKey, '', {
          contentType: file.type || undefined,
          bytes: file.size || undefined,
        });

        // Get image dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(objectUrl);
          };
          img.onerror = () => {
            resolve({ width: 100, height: 100 }); // Default if image fails to load
            URL.revokeObjectURL(objectUrl);
          };
          img.src = objectUrl;
        });

        // Get max zIndex and add 1
        const maxZIndex = cardElements.length > 0
          ? Math.max(...cardElements.map((el) => el.zIndex))
          : 0;

        // Place element in center of canvas with natural dimensions
        await createSceneElement(
          card.id,
          assetId,
          0.5, // 50% from left
          0.5, // 50% from top
          maxZIndex + 1,
          dimensions.width,
          dimensions.height
        );
      } catch (error) {
        console.error('Failed to upload element:', error);
        alert('Failed to upload element. Please try again.');
      }
    },
    [card, projectId, cardElements]
  );

  const handleElementClick = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();
      setSelectedElementId(elementId);
    },
    []
  );

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.stopPropagation();

      // Check if clicking on a resize handle
      const target = e.target as HTMLElement;
      if (target.dataset.handle) {
        return; // Let resize handle handle it
      }

      setSelectedElementId(elementId);
      const element = cardElements.find((el) => el.id === elementId);
      if (!element || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calculate the element's center position in canvas coordinates
      const elementCenterX = element.positionX * rect.width;
      const elementCenterY = element.positionY * rect.height;
      
      // Calculate the offset from the element's center to the click point
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const offsetX = (clickX - elementCenterX) / rect.width;
      const offsetY = (clickY - elementCenterY) / rect.height;

      setDraggingElementId(elementId);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [cardElements]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, handleType: ResizeHandleType) => {
      e.stopPropagation();
      e.preventDefault();

      const element = cardElements.find((el) => el.id === elementId);
      if (!element || !canvasRef.current) return;

      const imgElement = elementImageRefs.current.get(elementId);
      const imgWidth = imgElement?.offsetWidth || element.width || 100;
      const imgHeight = imgElement?.offsetHeight || element.height || 100;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const elementCenterX = element.positionX * canvasRect.width;
      const elementCenterY = element.positionY * canvasRect.height;
      
      const bounds = {
        x: elementCenterX - imgWidth / 2,
        y: elementCenterY - imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
      };

      setResizingElementId(elementId);
      setResizeHandle(handleType);
      setResizeStartBounds({
        ...bounds,
        startX: e.clientX - canvasRect.left,
        startY: e.clientY - canvasRect.top,
      });
      setSelectedElementId(elementId);
    },
    [cardElements]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();

      // Handle resizing
      if (resizingElementId && resizeHandle && resizeStartBounds) {
        const element = cardElements.find((el) => el.id === resizingElementId);
        if (!element) return;

        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const deltaX = currentX - resizeStartBounds.startX;
        const deltaY = currentY - resizeStartBounds.startY;

        let newWidth = resizeStartBounds.width;
        let newHeight = resizeStartBounds.height;
        let newX = resizeStartBounds.x;
        let newY = resizeStartBounds.y;

        // Calculate new bounds based on handle type
        switch (resizeHandle) {
          case 'nw': // top-left
            newWidth = Math.max(20, resizeStartBounds.width - deltaX);
            newHeight = Math.max(20, resizeStartBounds.height - deltaY);
            newX = resizeStartBounds.x + deltaX;
            newY = resizeStartBounds.y + deltaY;
            break;
          case 'n': // top
            newHeight = Math.max(20, resizeStartBounds.height - deltaY);
            newY = resizeStartBounds.y + deltaY;
            break;
          case 'ne': // top-right
            newWidth = Math.max(20, resizeStartBounds.width + deltaX);
            newHeight = Math.max(20, resizeStartBounds.height - deltaY);
            newY = resizeStartBounds.y + deltaY;
            break;
          case 'e': // right
            newWidth = Math.max(20, resizeStartBounds.width + deltaX);
            break;
          case 'se': // bottom-right
            newWidth = Math.max(20, resizeStartBounds.width + deltaX);
            newHeight = Math.max(20, resizeStartBounds.height + deltaY);
            break;
          case 's': // bottom
            newHeight = Math.max(20, resizeStartBounds.height + deltaY);
            break;
          case 'sw': // bottom-left
            newWidth = Math.max(20, resizeStartBounds.width - deltaX);
            newHeight = Math.max(20, resizeStartBounds.height + deltaY);
            newX = resizeStartBounds.x + deltaX;
            break;
          case 'w': // left
            newWidth = Math.max(20, resizeStartBounds.width - deltaX);
            newX = resizeStartBounds.x + deltaX;
            break;
        }

        // Calculate new center position in percentage coordinates
        const centerX = (newX + newWidth / 2) / rect.width;
        const centerY = (newY + newHeight / 2) / rect.height;

        // Clamp to canvas bounds
        const clampedX = Math.max(newWidth / 2 / rect.width, Math.min(1 - newWidth / 2 / rect.width, centerX));
        const clampedY = Math.max(newHeight / 2 / rect.height, Math.min(1 - newHeight / 2 / rect.height, centerY));

        // Update in real-time (optimistic update)
        updateSceneElement(resizingElementId, {
          positionX: clampedX,
          positionY: clampedY,
          width: newWidth,
          height: newHeight,
        });
        return;
      }

      // Handle dragging
      if (draggingElementId && dragOffset) {
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const newX = Math.max(0, Math.min(1, x - dragOffset.x));
        const newY = Math.max(0, Math.min(1, y - dragOffset.y));

        updateSceneElement(draggingElementId, {
          positionX: newX,
          positionY: newY,
        });
      }
    },
    [draggingElementId, dragOffset, resizingElementId, resizeHandle, resizeStartBounds, cardElements]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingElementId(null);
    setDragOffset(null);
    setResizingElementId(null);
    setResizeHandle(null);
    setResizeStartBounds(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas (not on an element)
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setSelectedElementId(null);
      setShowLinkDropdown(null);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.link-dropdown-container') && !target.closest('[data-link-button]')) {
        setShowLinkDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteElement = useCallback(
    async (elementId: string) => {
      if (!confirm('Delete this element?')) return;
      await deleteSceneElement(elementId);
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [selectedElementId]
  );

  const handleLinkElement = useCallback(
    async (elementId: string, targetCardId: string | null) => {
      await updateSceneElement(elementId, { targetCardId });
    },
    []
  );

  const handleMoveLayer = useCallback(
    (elementId: string, direction: 'back' | 'forward') => {
      const element = cardElements.find((el) => el.id === elementId);
      if (!element) return;

      // Sort elements by zIndex to find adjacent elements
      const sortedElements = [...cardElements].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedElements.findIndex((el) => el.id === elementId);
      
      if (direction === 'back') {
        // Move back: swap with the element immediately behind (lower zIndex)
        if (currentIndex > 0) {
          const elementBehind = sortedElements[currentIndex - 1];
          // Swap z-index values
          updateSceneElement(elementId, { zIndex: elementBehind.zIndex });
          updateSceneElement(elementBehind.id, { zIndex: element.zIndex });
        }
      } else {
        // Move forward: swap with the element immediately in front (higher zIndex)
        if (currentIndex < sortedElements.length - 1) {
          const elementInFront = sortedElements[currentIndex + 1];
          // Swap z-index values
          updateSceneElement(elementId, { zIndex: elementInFront.zIndex });
          updateSceneElement(elementInFront.id, { zIndex: element.zIndex });
        }
      }
    },
    [cardElements]
  );

  // Get cursor style for resize handles
  const getResizeCursor = (handleType: ResizeHandleType): string => {
    switch (handleType) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      default:
        return 'default';
    }
  };

  // Render bounding box and handles for selected element
  const renderBoundingBox = (element: SceneElement) => {
    const imgElement = elementImageRefs.current.get(element.id);
    const imgWidth = imgElement?.offsetWidth || element.width || 100;
    const imgHeight = imgElement?.offsetHeight || element.height || 100;

    return (
      <>
        {/* Bounding Box Border - positioned around the image */}
        <div
          className="absolute border-2 border-blue-500 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${imgWidth}px`,
            height: `${imgHeight}px`,
          }}
        />

        {/* Resize Handles */}
        {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandleType[]).map((handleType) => {
          let left = 0;
          let top = 0;

          switch (handleType) {
            case 'nw':
              left = -imgWidth / 2;
              top = -imgHeight / 2;
              break;
            case 'n':
              left = 0;
              top = -imgHeight / 2;
              break;
            case 'ne':
              left = imgWidth / 2;
              top = -imgHeight / 2;
              break;
            case 'e':
              left = imgWidth / 2;
              top = 0;
              break;
            case 'se':
              left = imgWidth / 2;
              top = imgHeight / 2;
              break;
            case 's':
              left = 0;
              top = imgHeight / 2;
              break;
            case 'sw':
              left = -imgWidth / 2;
              top = imgHeight / 2;
              break;
            case 'w':
              left = -imgWidth / 2;
              top = 0;
              break;
          }

          return (
            <div
              key={handleType}
              data-handle={handleType}
              className="absolute w-2 h-2 bg-blue-500 border-2 border-white rounded-sm cursor-pointer z-10"
              style={{
                left: `calc(50% + ${left}px)`,
                top: `calc(50% + ${top}px)`,
                transform: 'translate(-50%, -50%)',
                cursor: getResizeCursor(handleType),
              }}
              onMouseDown={(e) => handleResizeStart(e, element.id, handleType)}
            />
          );
        })}
      </>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-gray-100 overflow-hidden canvas-background"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background - static, not draggable */}
          {backgroundImageUrl ? (
            <img
              src={backgroundImageUrl}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover canvas-background pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 canvas-background pointer-events-none">
              No background image
            </div>
          )}

          {/* Elements - render in descending z-index order (highest last) so DOM order matches visual stacking */}
          {[...cardElements].sort((a, b) => b.zIndex - a.zIndex).map((element) => {
            const imageUrl = elementImageUrls[element.id];
            if (!imageUrl) return null;

            const isSelected = selectedElementId === element.id;
            const isDragging = draggingElementId === element.id;

            return (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.positionX * 100}%`,
                  top: `${element.positionY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: element.zIndex,
                  opacity: isDragging ? 0.7 : 1,
                  cursor: element.targetCardId ? 'pointer' : 'default',
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                onClick={(e) => handleElementClick(e, element.id)}
              >
                <img
                  ref={(img) => {
                    if (img) {
                      elementImageRefs.current.set(element.id, img);
                    } else {
                      elementImageRefs.current.delete(element.id);
                    }
                  }}
                  src={imageUrl}
                  alt="Element"
                  style={{
                    width: element.width ? `${element.width}px` : 'auto',
                    height: element.height ? `${element.height}px` : 'auto',
                    display: 'block',
                  }}
                  draggable={false}
                  onLoad={(e) => {
                    // Update element dimensions if not set
                    const img = e.currentTarget;
                    if (!element.width || !element.height) {
                      updateSceneElement(element.id, {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                    }
                  }}
                />

                {/* Bounding Box and Resize Handles */}
                {isSelected && renderBoundingBox(element)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Rail Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col" style={{ height: '100%' }}>
        <h2 className="text-lg font-semibold p-4 pb-2">Scene Builder</h2>

        <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
          {/* Background Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {backgroundImageUrl && (
              <p className="text-xs text-gray-500 mt-1">Background image uploaded</p>
            )}
          </div>

          {/* Add Element Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Element (JPG, PNG, GIF, WebP)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleElementUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
          </div>

          {/* Elements List */}
          {cardElements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Elements</h3>
              <div className="space-y-3">
                {cardElementsForSidebar.map((element) => {
                  const imageUrl = elementImageUrls[element.id];
                  if (!imageUrl) return null;

                  const elementAsset = assets.find((a) => a.id === element.assetId);
                  const fileName = elementAsset?.storageKey?.split('/').pop() || 'element.png';
                  const isSelected = selectedElementId === element.id;
                  const isHoveredDelete = hoveredDeleteId === element.id;
                  const isHoveredLink = hoveredLinkId === element.id;

                  return (
                    <div
                      key={element.id}
                      className={`border rounded-lg p-3 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedElementId(element.id)}
                    >
                      {/* Element Thumbnail */}
                      <div className="mb-2">
                        <img
                          src={imageUrl}
                          alt={fileName}
                          className="w-full h-24 object-contain bg-gray-100 rounded"
                        />
                      </div>

                      {/* Element Name */}
                      <p className="text-xs text-gray-600 mb-3 truncate" title={fileName}>
                        {fileName}
                      </p>

                      {/* Controls */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Layer Controls */}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(element.id, 'back');
                            }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            title="Send Back"
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveLayer(element.id, 'forward');
                            }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            title="Bring Forward"
                          >
                            ↑
                          </button>
                        </div>

                        {/* Link and Delete Buttons */}
                        <div className="flex gap-2">
                          {/* Link Button */}
                          <div className="relative link-dropdown-container">
                            <button
                              data-link-button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElementId(element.id);
                                // Toggle link dropdown
                                if (showLinkDropdown === element.id) {
                                  setShowLinkDropdown(null);
                                } else {
                                  setShowLinkDropdown(element.id);
                                }
                              }}
                              onMouseEnter={() => setHoveredLinkId(element.id)}
                              onMouseLeave={() => {
                                // Small delay to allow mouse to move to dropdown
                                setTimeout(() => {
                                  if (showLinkDropdown !== element.id) {
                                    setHoveredLinkId(null);
                                  }
                                }, 100);
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                isHoveredLink || showLinkDropdown === element.id
                                  ? 'bg-blue-600 text-white shadow-lg scale-110'
                                  : element.targetCardId
                                  ? 'bg-green-100 text-green-600 border-2 border-green-300 shadow-md'
                                  : 'bg-white text-gray-600 border-2 border-gray-300 shadow-md'
                              }`}
                              title={element.targetCardId ? 'Change link' : 'Link to card'}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: '16px',
                                  color: isHoveredLink || showLinkDropdown === element.id ? 'white' : element.targetCardId ? '#059669' : '#4b5563',
                                  fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
                                }}
                              >
                                {element.targetCardId ? 'link' : 'link_off'}
                              </span>
                            </button>
                            
                            {/* Link Dropdown - appears when link button is clicked */}
                            {showLinkDropdown === element.id && (
                              <div
                                className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-[200px] link-dropdown-container"
                                onMouseEnter={() => setHoveredLinkId(element.id)}
                                onMouseLeave={() => {
                                  setTimeout(() => {
                                    if (showLinkDropdown !== element.id) {
                                      setHoveredLinkId(null);
                                    }
                                  }, 100);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="block text-xs text-gray-600 mb-1">Link to Card</label>
                                <select
                                  value={element.targetCardId || ''}
                                  onChange={(e) => {
                                    handleLinkElement(element.id, e.target.value || null);
                                    setShowLinkDropdown(null);
                                  }}
                                  className="w-full p-1.5 border border-gray-300 rounded text-sm"
                                  onClick={(e) => e.stopPropagation()}
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
                              </div>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(element.id);
                            }}
                            onMouseEnter={() => setHoveredDeleteId(element.id)}
                            onMouseLeave={() => setHoveredDeleteId(null)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isHoveredDelete
                                ? 'bg-red-600 text-white shadow-lg scale-110'
                                : 'bg-white text-gray-600 border-2 border-gray-300 shadow-md'
                            }`}
                            title="Delete element"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: '16px',
                                color: isHoveredDelete ? 'white' : '#4b5563',
                                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
                              }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Link Status */}
                      {element.targetCardId && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Linked to: {allCards.find(c => c.id === element.targetCardId)?.caption || 'Card'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cardElements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No elements yet. Upload a PNG to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
