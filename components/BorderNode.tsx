'use client';

import { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';

export default memo(function BorderNode({ selected }: NodeProps) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Inner transparent area - no pointer events */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            pointerEvents: 'none',
          }}
        />
        {/* Outer border - clickable */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: '1px solid #000',
            borderRadius: '8px',
            pointerEvents: 'auto',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </>
  );
});
