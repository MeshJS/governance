import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Handle,
  Position,
  NodeProps,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { meshSDKNodes } from './MeshSDKCarousel';
import styles from '../styles/MeshSDKComponents.module.css';

interface SDKNodeData {
  label: string;
  description?: string;
  url?: string;
}

interface MeshSDKArchitectureChartProps {
  height?: number;
  highlightedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
}

// Custom node component for SDK packages  
const SDKPackageNode: React.FC<NodeProps & { highlightedNodeId?: string; onNodeClick?: (nodeId: string) => void }> = ({ 
  data, 
  selected, 
  id, 
  highlightedNodeId,
  onNodeClick
}) => {
  const nodeData = data as unknown as SDKNodeData;
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  // Simple click handler to notify parent
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (id && onNodeClick) {
      onNodeClick(id);
    }
  };

  const isCore = nodeData.label === '@meshsdk/core';
  const isExternal = nodeData.label.includes('@sidan-lab') || nodeData.label.includes('@cardano-sdk') || nodeData.label.includes('@harmoniclabs');
  const isHighlighted = highlightedNodeId === id;

  // Determine which handles should be visible based on edges
  const hasIncomingEdges = React.useMemo(() => {
    // Define which nodes have incoming edges (targets)
    const nodesWithIncoming = ['react', 'transaction', 'wallet', 'provider', 'contract', 'common', 'core_csl', 'core_cst', 'sidan_csl', 'cardano_sdk', 'harmoniclabs'];
    return nodesWithIncoming.includes(id || '');
  }, [id]);

  const hasOutgoingEdges = React.useMemo(() => {
    // Define which nodes have outgoing edges (sources)
    const nodesWithOutgoing = ['core', 'react', 'transaction', 'provider', 'core_csl', 'core_cst'];
    return nodesWithOutgoing.includes(id || '');
  }, [id]);
  
  return (
    <div
      onClick={handleClick}
      style={{
        background: isHighlighted
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.15) 100%)'
          : isExternal
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)',
        border: selected || isHighlighted
          ? '2px solid rgba(255, 255, 255, 0.8)' 
          : isExternal
          ? '1px solid rgba(255, 255, 255, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '8px 12px',
        minWidth: '120px',
        textAlign: 'center',
        cursor: nodeData.url ? 'pointer' : 'default',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        boxShadow: isHighlighted
          ? '0 6px 20px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          : selected
          ? '0 4px 20px rgba(255, 255, 255, 0.2)'
          : '0 2px 10px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        if (nodeData.url) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = selected || isHighlighted
          ? '0 6px 20px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          : '0 2px 10px rgba(0, 0, 0, 0.2)';
      }}
    >
      {hasIncomingEdges && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(255, 255, 255, 1)',
            width: 5,
            height: 5,
          }}
        />
      )}
      {hasOutgoingEdges && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(255, 255, 255, 1)',
            width: 5,
            height: 5,
          }}
        />
      )}
      <div style={{
        color: isHighlighted 
          ? 'rgba(255, 255, 255, 1)' 
          : 'rgba(255, 255, 255, 0.9)',
        fontWeight: isHighlighted ? '650' : '600',
        fontSize: isHighlighted ? '12px' : '11px',
        textShadow: isHighlighted 
          ? '0 0 8px rgba(255, 255, 255, 0.3)' 
          : 'none',
        lineHeight: '1.2',
        wordBreak: 'break-word',
      }}>
        {nodeData.label}
      </div>
      
      {/* Tooltip */}
      {showTooltip && nodeData.description && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '12px',
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '11px',
          fontWeight: '500',
          width: '300px',
          minWidth: '200px',
          textAlign: 'center',
          lineHeight: '1.3',
          whiteSpace: 'normal',
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          pointerEvents: 'none',
        }}>
          {nodeData.description}
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(0, 0, 0, 0.95)',
          }} />
        </div>
      )}
    </div>
  );
};

// Custom edge style
const defaultEdgeOptions = {
  style: {
    stroke: 'rgba(255, 255, 255, 0.6)',
    strokeWidth: 2,
  },
  markerEnd: 'arrowclosed' as const,
};

const MeshSDKArchitectureChart: React.FC<MeshSDKArchitectureChartProps> = ({ height = 600, highlightedNodeId, onNodeClick }) => {
  // Simple node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [onNodeClick]);
  
  // Define node types with highlighted node prop and click handler
  const nodeTypes = useMemo(() => ({
    sdkPackage: (props: NodeProps) => (
      <SDKPackageNode 
        {...props} 
        highlightedNodeId={highlightedNodeId} 
        onNodeClick={handleNodeClick}
      />
    ),
  }), [highlightedNodeId, handleNodeClick]);

  // Define initial nodes in structured rows
  const initialNodes: Node[] = useMemo(() => [
    // Row 1 - Core package (center)
    {
      id: 'core',
      type: 'sdkPackage',
      position: { x: 500, y: 80 },
      data: { 
        label: '@meshsdk/core',
        description: 'Exports all the functionalities including wallets, transactions, and providers',
        url: 'https://docs.meshjs.dev/core'
      },
    },
    
    // Row 2 - React package (center)
    {
      id: 'react',
      type: 'sdkPackage',
      position: { x: 500, y: 200 },
      data: { 
        label: '@meshsdk/react',
        description: 'React component library',
        url: 'https://meshjs.dev/react'
      },
    },
    
    // Row 3 - Application packages (evenly spaced)
    {
      id: 'transaction',
      type: 'sdkPackage',
      position: { x: 150, y: 320 },
      data: { 
        label: '@meshsdk/transaction',
        description: 'Transactions to send assets, mint tokens, and interact with smart contracts',
        url: 'https://docs.meshjs.dev/transactions'
      },
    },
    {
      id: 'wallet',
      type: 'sdkPackage',
      position: { x: 400, y: 320 },
      data: { 
        label: '@meshsdk/wallet',
        description: 'Wallets to manage assets and interact with the blockchain',
        url: 'https://docs.meshjs.dev/wallets'
      },
    },
    {
      id: 'provider',
      type: 'sdkPackage',
      position: { x: 650, y: 320 },
      data: { 
        label: '@meshsdk/provider',
        description: 'Blockchain data providers',
        url: 'https://docs.meshjs.dev/providers'
      },
    },
    {
      id: 'contract',
      type: 'sdkPackage',
      position: { x: 900, y: 320 },
      data: { 
        label: '@meshsdk/contract',
        description: 'A collection of smart contracts and its transactions',
        url: 'https://github.com/MeshJS/mesh/tree/main/packages/mesh-contract'
      },
    },
    
    // Row 4 - Core packages (evenly spaced)
    {
      id: 'common',
      type: 'sdkPackage',
      position: { x: 250, y: 440 },
      data: { 
        label: '@meshsdk/common',
        description: 'Contains constants, types and interfaces used across the SDK and different serialization libraries',
        url: 'https://github.com/MeshJS/mesh/tree/main/packages/mesh-common'
      },
    },
    {
      id: 'core_csl',
      type: 'sdkPackage',
      position: { x: 500, y: 440 },
      data: { 
        label: '@meshsdk/core-csl',
        description: 'Types and utilities functions between Mesh and cardano-serialization-lib',
        url: 'https://docs.meshjs.dev/core-csl'
      },
    },
    {
      id: 'core_cst',
      type: 'sdkPackage',
      position: { x: 750, y: 440 },
      data: { 
        label: '@meshsdk/core-cst',
        description: 'Types and utilities functions between Mesh and cardano-js-sdk',
        url: 'https://docs.meshjs.dev/core-cst'
      },
    },
    
    // Row 5 - External dependencies (evenly spaced)
    {
      id: 'sidan_csl',
      type: 'sdkPackage',
      position: { x: 200, y: 560 },
      data: { 
        label: '@sidan-lab/*',
        description: 'CSL utilities',
        url: 'https://github.com/sidan-lab'
      },
    },
    {
      id: 'cardano_sdk',
      type: 'sdkPackage',
      position: { x: 500, y: 560 },
      data: { 
        label: '@cardano-sdk/*',
        description: 'Cardano SDK',
        url: 'https://github.com/input-output-hk'
      },
    },
    {
      id: 'harmoniclabs',
      type: 'sdkPackage',
      position: { x: 800, y: 560 },
      data: { 
        label: '@harmoniclabs/*',
        description: 'Harmonic Labs',
        url: 'https://github.com/HarmonicLabs'
      },
    },
  ], []);

  // Define initial edges with only top/bottom connections for clean vertical flow
  const initialEdges: Edge[] = useMemo(() => [
    // Core to React (straight down)
    { 
      id: 'core-react', 
      source: 'core', 
      target: 'react',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // React to application packages (all from bottom to top)
    { 
      id: 'react-transaction', 
      source: 'react', 
      target: 'transaction',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'react-wallet', 
      source: 'react', 
      target: 'wallet',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // Core to other packages
    { 
      id: 'core-provider', 
      source: 'core', 
      target: 'provider',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core-transaction', 
      source: 'core', 
      target: 'transaction',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core-wallet', 
      source: 'core', 
      target: 'wallet',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core-contract', 
      source: 'core', 
      target: 'contract',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // Core to common
    { 
      id: 'core-common', 
      source: 'core', 
      target: 'common',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // Core to serialization packages
    { 
      id: 'core-core_csl', 
      source: 'core', 
      target: 'core_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core-core_cst', 
      source: 'core', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // Application packages to serialization layer (all vertical)
    { 
      id: 'transaction-core_csl', 
      source: 'transaction', 
      target: 'core_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'transaction-core_cst', 
      source: 'transaction', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'provider-core_cst', 
      source: 'provider', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    
    // Serialization to external dependencies (straight down)
    { 
      id: 'core_csl-sidan_csl', 
      source: 'core_csl', 
      target: 'sidan_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core_cst-cardano_sdk', 
      source: 'core_cst', 
      target: 'cardano_sdk',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
    { 
      id: 'core_cst-harmoniclabs', 
      source: 'core_cst', 
      target: 'harmoniclabs',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      ...defaultEdgeOptions 
    },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div 
      className={styles.architectureChart}
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={1.0}
        maxZoom={1.0}
        defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        preventScrolling={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        style={{
          background: 'transparent',
          borderRadius: 0,
        }}
      >
        <Background
          color="rgba(255, 255, 255, 0.1)"
          gap={20}
          size={1}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </ReactFlow>

      {/* Go to button removed */}
    </div>
  );
};

export default MeshSDKArchitectureChart;