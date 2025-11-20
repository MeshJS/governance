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
        background: '#ffffff',
        border: selected || isHighlighted
          ? '2px solid rgba(0, 0, 0, 0.3)' 
          : isExternal
          ? '1px solid rgba(0, 0, 0, 0.15)'
          : '1px solid rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        padding: '8px 12px',
        minWidth: '120px',
        textAlign: 'center',
        cursor: nodeData.url ? 'pointer' : 'default',
        boxShadow: isHighlighted
          ? '0 8px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)'
          : selected
          ? '0 6px 24px -2px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        if (nodeData.url) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 32px -4px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = isHighlighted
          ? '0 8px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)'
          : selected
          ? '0 6px 24px -2px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      {hasIncomingEdges && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ 
            background: '#000000', 
            border: '1px solid rgba(0, 0, 0, 0.3)',
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
            background: '#000000', 
            border: '1px solid rgba(0, 0, 0, 0.3)',
            width: 5,
            height: 5,
          }}
        />
      )}
      <div style={{
        color: isHighlighted 
          ? 'rgba(0, 0, 0, 0.95)' 
          : 'rgba(0, 0, 0, 0.9)',
        fontWeight: isHighlighted ? '650' : '600',
        fontSize: isHighlighted ? '12px' : '11px',
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
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          padding: '8px 12px',
          color: 'rgba(0, 0, 0, 0.9)',
          fontSize: '11px',
          fontWeight: '500',
          width: '300px',
          minWidth: '200px',
          textAlign: 'center',
          lineHeight: '1.3',
          whiteSpace: 'normal',
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
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
            borderTop: '6px solid rgba(255, 255, 255, 0.95)',
          }} />
        </div>
      )}
    </div>
  );
};

// Custom edge style
const defaultEdgeOptions = {
  style: {
    stroke: '#000000',
    strokeWidth: 1.5,
    strokeOpacity: 0.4,
  },
  markerEnd: 'arrowclosed' as const,
};

const MeshSDKArchitectureChart: React.FC<MeshSDKArchitectureChartProps> = ({ height = 600, highlightedNodeId, onNodeClick }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const reactFlowInstance = React.useRef<any>(null);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive positions based on window width
  const calculatePositions = useCallback(() => {
    const containerWidth = Math.min(windowWidth - 100, 1200); // Max width with padding
    const centerX = containerWidth / 2;
    
    // Responsive spacing
    const spacing = Math.max(200, Math.min(300, containerWidth / 5));
    const rowSpacing = 120;
    
    return {
      centerX,
      spacing,
      rowSpacing,
      // Row 1 - Core (center)
      row1: { x: centerX, y: 80 },
      // Row 2 - React (center)
      row2: { x: centerX, y: 80 + rowSpacing },
      // Row 3 - Application packages (4 items)
      row3: {
        x1: centerX - spacing * 1.5,
        x2: centerX - spacing * 0.5,
        x3: centerX + spacing * 0.5,
        x4: centerX + spacing * 1.5,
        y: 80 + rowSpacing * 2,
      },
      // Row 4 - Core packages (3 items)
      row4: {
        x1: centerX - spacing,
        x2: centerX,
        x3: centerX + spacing,
        y: 80 + rowSpacing * 3,
      },
      // Row 5 - External dependencies (3 items)
      row5: {
        x1: centerX - spacing,
        x2: centerX,
        x3: centerX + spacing,
        y: 80 + rowSpacing * 4,
      },
    };
  }, [windowWidth]);

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

  // Define nodes with responsive positions
  const initialNodes: Node[] = useMemo(() => {
    const pos = calculatePositions();
    
    return [
      // Row 1 - Core package (center)
      {
        id: 'core',
        type: 'sdkPackage',
        position: { x: pos.row1.x, y: pos.row1.y },
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
        position: { x: pos.row2.x, y: pos.row2.y },
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
        position: { x: pos.row3.x1, y: pos.row3.y },
        data: { 
          label: '@meshsdk/transaction',
          description: 'Transactions to send assets, mint tokens, and interact with smart contracts',
          url: 'https://docs.meshjs.dev/transactions'
        },
      },
      {
        id: 'wallet',
        type: 'sdkPackage',
        position: { x: pos.row3.x2, y: pos.row3.y },
        data: { 
          label: '@meshsdk/wallet',
          description: 'Wallets to manage assets and interact with the blockchain',
          url: 'https://docs.meshjs.dev/wallets'
        },
      },
      {
        id: 'provider',
        type: 'sdkPackage',
        position: { x: pos.row3.x3, y: pos.row3.y },
        data: { 
          label: '@meshsdk/provider',
          description: 'Blockchain data providers',
          url: 'https://docs.meshjs.dev/providers'
        },
      },
      {
        id: 'contract',
        type: 'sdkPackage',
        position: { x: pos.row3.x4, y: pos.row3.y },
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
        position: { x: pos.row4.x1, y: pos.row4.y },
        data: { 
          label: '@meshsdk/common',
          description: 'Contains constants, types and interfaces used across the SDK and different serialization libraries',
          url: 'https://github.com/MeshJS/mesh/tree/main/packages/mesh-common'
        },
      },
      {
        id: 'core_csl',
        type: 'sdkPackage',
        position: { x: pos.row4.x2, y: pos.row4.y },
        data: { 
          label: '@meshsdk/core-csl',
          description: 'Types and utilities functions between Mesh and cardano-serialization-lib',
          url: 'https://docs.meshjs.dev/core-csl'
        },
      },
      {
        id: 'core_cst',
        type: 'sdkPackage',
        position: { x: pos.row4.x3, y: pos.row4.y },
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
        position: { x: pos.row5.x1, y: pos.row5.y },
        data: { 
          label: '@sidan-lab/*',
          description: 'CSL utilities',
          url: 'https://github.com/sidan-lab'
        },
      },
      {
        id: 'cardano_sdk',
        type: 'sdkPackage',
        position: { x: pos.row5.x2, y: pos.row5.y },
        data: { 
          label: '@cardano-sdk/*',
          description: 'Cardano SDK',
          url: 'https://github.com/input-output-hk'
        },
      },
      {
        id: 'harmoniclabs',
        type: 'sdkPackage',
        position: { x: pos.row5.x3, y: pos.row5.y },
        data: { 
          label: '@harmoniclabs/*',
          description: 'Harmonic Labs',
          url: 'https://github.com/HarmonicLabs'
        },
      },
    ];
  }, [calculatePositions]);

  // Define initial edges with only top/bottom connections for clean vertical flow
  const initialEdges: Edge[] = useMemo(() => [
    // Core to React (straight down)
    { 
      id: 'core-react', 
      source: 'core', 
      target: 'react',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // React to application packages (all from bottom to top)
    { 
      id: 'react-transaction', 
      source: 'react', 
      target: 'transaction',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'react-wallet', 
      source: 'react', 
      target: 'wallet',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // Core to other packages
    { 
      id: 'core-provider', 
      source: 'core', 
      target: 'provider',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core-transaction', 
      source: 'core', 
      target: 'transaction',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core-wallet', 
      source: 'core', 
      target: 'wallet',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core-contract', 
      source: 'core', 
      target: 'contract',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // Core to common
    { 
      id: 'core-common', 
      source: 'core', 
      target: 'common',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // Core to serialization packages
    { 
      id: 'core-core_csl', 
      source: 'core', 
      target: 'core_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core-core_cst', 
      source: 'core', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // Application packages to serialization layer (all vertical)
    { 
      id: 'transaction-core_csl', 
      source: 'transaction', 
      target: 'core_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'transaction-core_cst', 
      source: 'transaction', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'provider-core_cst', 
      source: 'provider', 
      target: 'core_cst',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    
    // Serialization to external dependencies (straight down)
    { 
      id: 'core_csl-sidan_csl', 
      source: 'core_csl', 
      target: 'sidan_csl',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core_cst-cardano_sdk', 
      source: 'core_cst', 
      target: 'cardano_sdk',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
    { 
      id: 'core_cst-harmoniclabs', 
      source: 'core_cst', 
      target: 'harmoniclabs',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: {
        stroke: '#000000',
        strokeWidth: 1.5,
        strokeOpacity: 0.4,
      },
      markerEnd: 'arrowclosed' as const,
    },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node positions when window size changes
  React.useEffect(() => {
    const pos = calculatePositions();
    setNodes((nds) => 
      nds.map((node) => {
        const positions: { [key: string]: { x: number; y: number } } = {
          core: { x: pos.row1.x, y: pos.row1.y },
          react: { x: pos.row2.x, y: pos.row2.y },
          transaction: { x: pos.row3.x1, y: pos.row3.y },
          wallet: { x: pos.row3.x2, y: pos.row3.y },
          provider: { x: pos.row3.x3, y: pos.row3.y },
          contract: { x: pos.row3.x4, y: pos.row3.y },
          common: { x: pos.row4.x1, y: pos.row4.y },
          core_csl: { x: pos.row4.x2, y: pos.row4.y },
          core_cst: { x: pos.row4.x3, y: pos.row4.y },
          sidan_csl: { x: pos.row5.x1, y: pos.row5.y },
          cardano_sdk: { x: pos.row5.x2, y: pos.row5.y },
          harmoniclabs: { x: pos.row5.x3, y: pos.row5.y },
        };
        return {
          ...node,
          position: positions[node.id] || node.position,
        };
      })
    );
  }, [windowWidth, calculatePositions, setNodes]);

  // Fit view when nodes change
  React.useEffect(() => {
    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [nodes, windowWidth]);

  const onInit = React.useCallback((instance: any) => {
    reactFlowInstance.current = instance;
    instance.fitView({ padding: 0.2 });
  }, []);

  return (
    <div 
      className={styles.architectureChart}
      style={{ height, width: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
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
          width: '100%',
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