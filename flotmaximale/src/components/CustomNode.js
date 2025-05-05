// components/CustomNode.js
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, isConnectable }) => {
  return (
    <div className={data.isSource ? 'node-source' : data.isSink ? 'node-sink' : ''} style={{
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid #777',
      fontWeight: 'bold',
      backgroundColor: data.isSource ? '#90EE90' : data.isSink ? '#FF6347' : '#ffffff',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable && !data.isSource}
        style={{ visibility: data.isSource ? 'hidden' : 'visible' }}
      />
      <div>{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable && !data.isSink}
        style={{ visibility: data.isSink ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

export default memo(CustomNode);