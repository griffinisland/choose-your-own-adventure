'use client';

import React, { useState, memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

function DeletableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const onDelete = data?.onDelete;
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        id={`${id}-hover`}
        style={{
          ...style,
          stroke: 'transparent',
          strokeWidth: 32, // Increased from 20 to 32 for easier hover detection
          cursor: 'pointer',
          pointerEvents: 'stroke',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          // Small delay to allow mouse to move to button
          setTimeout(() => {
            if (!isButtonHovered) {
              setIsHovered(false);
            }
          }, 100);
        }}
      />
      {/* Visible edge path */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
        pointerEvents="none"
      />
      <EdgeLabelRenderer>
        {(isHovered || isButtonHovered) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onMouseEnter={() => {
              setIsButtonHovered(true);
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              setIsButtonHovered(false);
              setIsHovered(false);
            }}
          >
            <button
              onClick={handleDelete}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isButtonHovered
                  ? 'bg-blue-600 text-white shadow-lg scale-110'
                  : 'bg-white text-gray-600 border-2 border-gray-300 shadow-md'
              }`}
              title="Delete connection"
              style={{ zIndex: 1000 }}
            >
              {/* Material Icons broken link icon */}
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  color: isButtonHovered ? 'white' : '#4b5563',
                  fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
                }}
              >
                link_off
              </span>
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const DeletableEdge = memo(DeletableEdgeComponent);
