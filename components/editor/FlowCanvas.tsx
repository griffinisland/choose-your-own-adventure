'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
  useStore,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import { DeletableEdge } from './DeletableEdge';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

type SceneElement = AppSchema['sceneElements'];

interface FlowCanvasProps {
  cards: Card[];
  choices: Choice[];
  cardImages: Record<string, string>;
  backgroundImages: Record<string, string>;
  sceneElements: SceneElement[];
  elementImages: Record<string, string>;
  onNodeDragStop: (cardId: string, x: number, y: number) => void;
  onConnect: (sourceCardId: string, targetCardId: string, choiceId?: string) => void;
  onNodeClick: (cardId: string) => void;
  onDeleteEdge?: (choiceId: string) => void;
  selectedCardId: string | null;
}

// Define nodeTypes and edgeTypes outside component to prevent recreation on each render
const nodeTypes: NodeTypes = {
  cardNode: CardNode,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

// Ensure they're stable references
const stableNodeTypes = nodeTypes;
const stableEdgeTypes = edgeTypes;

// Ghost preview component that follows the mouse during drag
// This component must be rendered inside ReactFlow to access useReactFlow hook
function DragPreviewInner({
  node,
  position,
  choices,
}: {
  node: Node;
  position: { x: number; y: number };
  choices: Choice[];
}) {
  const nodeData = node.data as CardNodeData;
  const cardChoices = choices
    .filter((c) => c.cardId === nodeData.card.id)
    .sort((a, b) => a.order - b.order);
  const zoom = useStore((state) => state.transform[2]);

  return (
    <div
      className="react-flow__node react-flow__nodesselection-none pointer-events-none"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${zoom})`,
        width: '256px',
        opacity: 0.5,
        zIndex: 1000,
      }}
    >
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300">
        {/* Image thumbnail */}
        <div className="w-full flex justify-center" style={{ height: '126px', backgroundColor: '#f3f4f6' }}>
          {nodeData.imageUrl ? (
            <img
              src={nodeData.imageUrl}
              alt={nodeData.card.caption || 'Card image'}
              className="object-cover"
              style={{ width: '224px', height: '126px' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="px-3 py-2 min-h-[60px]">
          <p
            className="text-sm text-gray-800 leading-tight"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nodeData.card.caption || 'Untitled Card'}
          </p>
        </div>

        {/* Choices */}
        {cardChoices.length > 0 && (
          <div className="px-3 pb-3 space-y-2">
            {cardChoices.map((choice) => (
              <div key={choice.id} className="relative flex items-center gap-2">
                <button
                  className="flex-1 bg-blue-600 text-white text-xs px-2 py-1.5 rounded text-left truncate"
                  disabled
                >
                  {choice.label && choice.label.length > 30
                    ? choice.label.substring(0, 30) + '...'
                    : choice.label || 'Choice'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardNodeData {
  card: Card;
  imageUrl: string | null;
  choices: Choice[];
  isSelected: boolean;
}

export function FlowCanvas({
  cards,
  choices,
  cardImages,
  backgroundImages,
  sceneElements,
  elementImages,
  onNodeDragStop,
  onConnect,
  onNodeClick,
  onDeleteEdge,
  selectedCardId,
}: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  const getRelativePosition = useCallback((event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const initialNodes: Node[] = useMemo(
    () =>
      cards.map((card) => {
        // Get scene elements for this card, sorted by zIndex
        const cardSceneElements = sceneElements
          .filter((el) => el.cardId === card.id)
          .sort((a, b) => a.zIndex - b.zIndex);

        return {
          id: card.id,
          type: 'cardNode',
          position: { x: card.positionX, y: card.positionY },
          data: {
            card,
            imageUrl: cardImages[card.id] || null,
            backgroundImageUrl: backgroundImages[card.id] || null,
            sceneElements: cardSceneElements,
            elementImages,
            choices,
            isSelected: card.id === selectedCardId,
          },
        };
      }),
    [cards, cardImages, backgroundImages, sceneElements, elementImages, choices, selectedCardId]
  );

  const handleEdgeDelete = useCallback(
    (edgeId: string) => {
      if (onDeleteEdge) {
        onDeleteEdge(edgeId);
      }
    },
    [onDeleteEdge]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      choices
        .filter((choice) => choice.targetCardId)
        .map((choice) => ({
          id: choice.id,
          type: 'deletable',
          source: choice.cardId,
          sourceHandle: `choice-${choice.id}`, // Connect from the choice handle
          target: choice.targetCardId!,
          animated: true,
          style: { 
            stroke: '#1083C0',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#1083C0',
          },
          data: {
            onDelete: handleEdgeDelete,
          },
        })),
    [choices, handleEdgeDelete]
  );

  const handleNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    // Reset drag tracking
    hasDraggedRef.current = false;
    dragStartPositionRef.current = null;
    
    setDraggedNodeId(node.id);
    const pos = getRelativePosition(event);
    if (pos) {
      setDragPosition(pos);
      dragStartPositionRef.current = pos;
    }
  }, [getRelativePosition]);

  const handleNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (draggedNodeId === node.id) {
      const pos = getRelativePosition(event);
      if (pos) {
        setDragPosition(pos);
        // Track if we've actually dragged (moved more than 10px in screen space)
        // This threshold needs to account for zoom level
        if (dragStartPositionRef.current) {
          const dx = pos.x - dragStartPositionRef.current.x;
          const dy = pos.y - dragStartPositionRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Use a larger threshold to distinguish clicks from drags
          if (distance > 10) {
            hasDraggedRef.current = true;
          }
        }
      }
    }
  }, [draggedNodeId, getRelativePosition]);

  const handleNodeDragStop = useCallback(
    (_: any, node: Node) => {
      const wasDragging = hasDraggedRef.current;
      
      // Always clear drag state immediately
      setDraggedNodeId(null);
      setDragPosition(null);
      dragStartPositionRef.current = null;
      hasDraggedRef.current = false;
      
      // Only update position if we actually dragged
      if (wasDragging) {
        onNodeDragStop(node.id, node.position.x, node.position.y);
      }
    },
    [onNodeDragStop]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Extract choiceId from sourceHandle if it's a choice connection
        const choiceId = connection.sourceHandle?.startsWith('choice-')
          ? connection.sourceHandle.replace('choice-', '')
          : undefined;
        
        onConnect(connection.source, connection.target, choiceId);
      }
    },
    [onConnect]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Always trigger click - ReactFlow handles distinguishing clicks from drags
      // The hasDraggedRef check was preventing clicks at different zoom levels
      onNodeClick(node.id);
      // Reset drag state
      hasDraggedRef.current = false;
      dragStartPositionRef.current = null;
    },
    [onNodeClick]
  );

  // Global mouseup handler to ensure drag state is cleared even if dragStop doesn't fire
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Only clear if we're dragging and the mouseup is outside ReactFlow
      // This prevents interference with normal ReactFlow interactions
      if (draggedNodeId && !containerRef.current?.contains(e.target as Node)) {
        // Clear drag state if it wasn't cleared properly
        setDraggedNodeId(null);
        setDragPosition(null);
        dragStartPositionRef.current = null;
        hasDraggedRef.current = false;
      }
    };

    // Use capture phase to catch mouseup events
    window.addEventListener('mouseup', handleGlobalMouseUp, true);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp, true);
    };
  }, [draggedNodeId]);

  // Get the dragged node data for the ghost preview
  const draggedNode = draggedNodeId
    ? initialNodes.find((n) => n.id === draggedNodeId)
    : null;

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <ReactFlowWithZoomLock
        nodes={initialNodes}
        edges={initialEdges}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      onNodeClick={handleNodeClick}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
        draggedNode={draggedNode}
        dragPosition={dragPosition}
        choices={choices}
      />
    </div>
  );
}

// Component to lock zoom at 50% - must be rendered inside ReactFlow
function ZoomLock() {
  const { setViewport, getViewport } = useReactFlow();

  // Lock zoom to 0.5 (50%) - check and reset periodically
  useEffect(() => {
    const checkZoom = () => {
      const viewport = getViewport();
      // Always reset zoom to 0.5, but preserve x and y panning
      if (Math.abs(viewport.zoom - 0.5) > 0.01) {
        setViewport({ x: viewport.x, y: viewport.y, zoom: 0.5 }, { duration: 0 });
      }
    };

    // Set initial zoom to 0.5
    setViewport({ x: 0, y: 0, zoom: 0.5 }, { duration: 0 });
    
    // Check periodically (every 100ms) to catch any edge cases
    checkZoom();
    const interval = setInterval(checkZoom, 100);

    return () => clearInterval(interval);
  }, [getViewport, setViewport]);

  return null;
}

function ReactFlowWithZoomLock({
  nodes,
  edges,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onConnect,
  onNodeClick,
  draggedNode,
  dragPosition,
  choices,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeDragStart: (event: React.MouseEvent, node: Node) => void;
  onNodeDrag: (event: React.MouseEvent, node: Node) => void;
  onNodeDragStop: (_: any, node: Node) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (_: React.MouseEvent, node: Node) => void;
  draggedNode: Node | null;
  dragPosition: { x: number; y: number } | null;
  choices: Choice[];
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={stableNodeTypes}
      edgeTypes={stableEdgeTypes}
      fitView={false}
      defaultEdgeOptions={{
        style: { stroke: '#1083C0', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1083C0' },
      }}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
      minZoom={0.5}
      maxZoom={0.5}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      <Controls showZoom={false} showFitView={true} showInteractive={false} />
      <MiniMap 
        nodeColor={(node) => {
          if (node.data?.isSelected) return '#1083C0';
          return '#94a3b8';
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
      
      {/* Zoom lock component - must be inside ReactFlow */}
      <ZoomLock />
      
      {/* Ghost preview that follows the mouse */}
      {draggedNode && dragPosition && (
        <DragPreviewInner
          node={draggedNode}
          position={dragPosition}
          choices={choices}
        />
      )}
    </ReactFlow>
  );
}
