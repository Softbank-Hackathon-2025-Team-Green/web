'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';

export default memo(function TextNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState((data.label as string) || 'Text');

  const handleChange = useCallback((value: string) => {
    setText(value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Update the node data in React Flow state
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: text,
            },
          };
        }
        return node;
      })
    );
  }, [id, text, setNodes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  }, [handleBlur]);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={30}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
        }}
      />
      <div
        className="px-2 py-1"
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#000',
          width: '100%',
          height: '100%',
          cursor: isEditing ? 'text' : 'move',
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full h-full bg-transparent border-none outline-none"
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {text}
          </div>
        )}
      </div>
    </>
  );
});
