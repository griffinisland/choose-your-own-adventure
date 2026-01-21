'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import { DeletableEdge } from './DeletableEdge';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

interface FlowCanvasProps {
  cards: Card[];
  choices: Choice[];
  cardImages: Record<string, string>;
  onNodeDragStop: (cardId: string, x: number, y: number) => void;
  onConnect: (sourceCardId: string, targetCardId: string, choiceId?: string) => void;
  onNodeClick: (cardId: string) => void;
  onDeleteEdge?: (choiceId: string) => void;
  selectedCardId: string | null;
}

const nodeTypes: NodeTypes = {
  cardNode: CardNode,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

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
  onNodeDragStop,
  onConnect,
  onNodeClick,
  onDeleteEdge,
  selectedCardId,
}: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

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
      cards.map((card) => ({
        id: card.id,
        type: 'cardNode',
        position: { x: card.positionX, y: card.positionY },
        data: {
          card,
          imageUrl: cardImages[card.id] || null,
          choices,
          isSelected: card.id === selectedCardId,
        },
      })),
    [cards, cardImages, choices, selectedCardId]
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
            type: 'arrowclosed',
            color: '#1083C0',
          },
          data: {
            onDelete: handleEdgeDelete,
          },
        })),
    [choices, handleEdgeDelete]
  );

  const handleNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNodeId(node.id);
    const pos = getRelativePosition(event);
    if (pos) setDragPosition(pos);
  }, [getRelativePosition]);

  const handleNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (draggedNodeId === node.id) {
      const pos = getRelativePosition(event);
      if (pos) setDragPosition(pos);
    }
  }, [draggedNodeId, getRelativePosition]);

  const handleNodeDragStop = useCallback(
    (_: any, node: Node) => {
      setDraggedNodeId(null);
      setDragPosition(null);
      onNodeDragStop(node.id, node.position.x, node.position.y);
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
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  // Get the dragged node data for the ghost preview
  const draggedNode = draggedNodeId
    ? initialNodes.find((n) => n.id === draggedNodeId)
    : null;

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          style: { stroke: '#1083C0', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#1083C0' },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.data?.isSelected) return '#1083C0';
            return '#94a3b8';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        
        {/* Ghost preview that follows the mouse */}
        {draggedNode && dragPosition && (
          <DragPreviewInner
            node={draggedNode}
            position={dragPosition}
            choices={choices}
          />
        )}
      </ReactFlow>
    </div>
  );
}
