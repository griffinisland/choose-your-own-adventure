'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import type { AppSchema } from '@/instant/schema';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];

interface FlowCanvasProps {
  cards: Card[];
  choices: Choice[];
  cardImages: Record<string, string>;
  onNodeDragStop: (cardId: string, x: number, y: number) => void;
  onConnect: (sourceCardId: string, targetCardId: string) => void;
  onNodeClick: (cardId: string) => void;
  selectedCardId: string | null;
}

const nodeTypes: NodeTypes = {
  cardNode: CardNode,
};

const edgeTypes: EdgeTypes = {};

export function FlowCanvas({
  cards,
  choices,
  cardImages,
  onNodeDragStop,
  onConnect,
  onNodeClick,
  selectedCardId,
}: FlowCanvasProps) {
  const initialNodes: Node[] = useMemo(
    () =>
      cards.map((card) => ({
        id: card.id,
        type: 'cardNode',
        position: { x: card.positionX, y: card.positionY },
        data: {
          card,
          imageUrl: cardImages[card.id] || null,
          isSelected: card.id === selectedCardId,
        },
      })),
    [cards, cardImages, selectedCardId]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      choices
        .filter((choice) => choice.targetCardId)
        .map((choice) => ({
          id: choice.id,
          source: choice.cardId,
          target: choice.targetCardId!,
          label: choice.label,
          animated: true,
          style: { strokeWidth: 2 },
        } as Edge)),
    [choices]
  );

  const handleNodeDragStop = useCallback(
    (_: any, node: Node) => {
      onNodeDragStop(node.id, node.position.x, node.position.y);
    },
    [onNodeDragStop]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        onConnect(connection.source, connection.target);
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

  return (
    <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  );
}
