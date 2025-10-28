/**
 * MESH SDK CAROUSEL AND ARCHITECTURE CHART - COMPLETE CODE EXPORT
 * 
 * This file contains all the code for the Mesh SDK Carousel and Architecture Chart components.
 * It includes the React components, TypeScript interfaces, CSS styles, and data structures.
 * 
 * Dependencies needed:
 * - React
 * - @xyflow/react
 * - react-icons (FaChevronLeft, FaChevronRight, FaExternalLinkAlt)
 * 
 * Usage:
 * 1. Install dependencies: npm install @xyflow/react react-icons
 * 2. Import and use the components in your React app
 * 3. Apply the CSS styles (included at the bottom)
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import '@xyflow/react/dist/style.css';

// =====================================================
// INTERFACES AND TYPES
// =====================================================

interface SDKNodeData {
  label: string;
  description?: string;
  url?: string;
}

interface MeshSDKCarouselProps {
  onNodeSelect?: (nodeId: string) => void;
  meshPackagesData?: any;
  highlightedNodeId?: string;
}

interface MeshSDKArchitectureChartProps {
  height?: number;
  highlightedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
}

// =====================================================
// DATA STRUCTURES
// =====================================================

// Export the node data for use in other components (filtered for carousel - only Mesh packages)
export const meshSDKNodes = [
  {
    id: 'core',
    label: '@meshsdk/core',
    description: 'Exports all the functionalities including wallets, transactions, and providers',
    url: 'https://docs.meshjs.dev/core',
    category: 'Core',
    isCore: true,
  },
  {
    id: 'react',
    label: '@meshsdk/react',
    description: 'React component library',
    url: 'https://meshjs.dev/react',
    category: 'Application',
    isCore: false,
  },
  {
    id: 'transaction',
    label: '@meshsdk/transaction',
    description: 'Transactions to send assets, mint tokens, and interact with smart contracts',
    url: 'https://meshjs.dev/apis/txbuilder',
    category: 'Application',
    isCore: false,
  },
  {
    id: 'wallet',
    label: '@meshsdk/wallet',
    description: 'Wallets to manage assets and interact with the blockchain',
    url: 'https://meshjs.dev/apis/wallets',
    category: 'Application',
    isCore: false,
  },
  {
    id: 'provider',
    label: '@meshsdk/provider',
    description: 'Blockchain data providers',
    url: 'https://meshjs.dev/providers',
    category: 'Application',
    isCore: false,
  },
  {
    id: 'contract',
    label: '@meshsdk/contract',
    description: 'A collection of smart contracts and its transactions',
    url: 'https://meshjs.dev/smart-contracts',
    category: 'Application',
    isCore: false,
  },
  {
    id: 'common',
    label: '@meshsdk/common',
    description: 'Contains constants, types and interfaces used across the SDK and different serialization libraries',
    url: 'https://github.com/MeshJS/mesh/tree/main/packages/mesh-common',
    category: 'Core',
    isCore: false,
  },
  {
    id: 'core_csl',
    label: '@meshsdk/core-csl',
    description: 'Types and utilities functions between Mesh and cardano-serialization-lib',
    url: 'https://docs.meshjs.dev/core-csl',
    category: 'Core',
    isCore: false,
  },
  {
    id: 'core_cst',
    label: '@meshsdk/core-cst',
    description: 'Types and utilities functions between Mesh and cardano-js-sdk',
    url: 'https://docs.meshjs.dev/core-cst',
    category: 'Core',
    isCore: false,
  },
];

// =====================================================
// ARCHITECTURE CHART COMPONENT
// =====================================================

// Custom node component for SDK packages  
const SDKPackageNode: React.FC<NodeProps & { highlightedNodeId?: string; onNodeClick?: (nodeId: string, position: { x: number; y: number }) => void }> = ({ data, selected, id, highlightedNodeId, onNodeClick }) => {
  const nodeData = data as unknown as SDKNodeData;
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (onNodeClick && id) {
      const rect = event.currentTarget.getBoundingClientRect();
      onNodeClick(id, {
        x: rect.right + 10, // Position button to the right of the node
        y: rect.top + rect.height / 2 - 15 // Center vertically
      });
    }
  }, [onNodeClick, id]);

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
        background: isCore 
          ? 'linear-gradient(135deg, rgba(12, 242, 180, 0.2) 0%, rgba(56, 232, 225, 0.15) 100%)'
          : isExternal
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(45, 212, 191, 0.1) 100%)',
        border: selected 
          ? '2px solid rgba(12, 242, 180, 0.8)' 
          : isHighlighted
          ? '1px solid rgba(12, 242, 180, 0.5)'
          : isCore
          ? '2px solid rgba(12, 242, 180, 0.4)'
          : isExternal
          ? '1px solid rgba(255, 255, 255, 0.2)'
          : '1px solid rgba(20, 184, 166, 0.3)',
        borderRadius: '12px',
        padding: '8px 12px',
        minWidth: '120px',
        textAlign: 'center',
        cursor: nodeData.url ? 'pointer' : 'default',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        boxShadow: isHighlighted
          ? '0 6px 20px rgba(12, 242, 180, 0.15), 0 2px 8px rgba(12, 242, 180, 0.1), 0 0 0 1px rgba(12, 242, 180, 0.1) inset'
          : isCore
          ? '0 4px 20px rgba(12, 242, 180, 0.3), 0 0 0 1px rgba(12, 242, 180, 0.1) inset'
          : selected
          ? '0 4px 20px rgba(12, 242, 180, 0.2)'
          : '0 2px 10px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        if (nodeData.url) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = isCore
            ? '0 6px 25px rgba(12, 242, 180, 0.4), 0 0 0 1px rgba(12, 242, 180, 0.2) inset'
            : '0 4px 20px rgba(12, 242, 180, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = isCore
          ? '0 4px 20px rgba(12, 242, 180, 0.3), 0 0 0 1px rgba(12, 242, 180, 0.1) inset'
          : selected
          ? '0 4px 20px rgba(12, 242, 180, 0.2)'
          : '0 2px 10px rgba(0, 0, 0, 0.2)';
      }}
    >
      {hasIncomingEdges && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ 
            background: 'rgba(12, 242, 180, 0.9)', 
            border: '1px solid rgba(12, 242, 180, 1)',
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
            background: 'rgba(12, 242, 180, 0.9)', 
            border: '1px solid rgba(12, 242, 180, 1)',
            width: 5,
            height: 5,
          }}
        />
      )}
      <div style={{
        color: isHighlighted 
          ? 'rgba(12, 242, 180, 1)' 
          : isCore 
          ? 'rgba(12, 242, 180, 1)' 
          : 'rgba(255, 255, 255, 0.9)',
        fontWeight: isHighlighted ? '650' : isCore ? '700' : '600',
        fontSize: isHighlighted ? '12px' : isCore ? '12px' : '11px',
        textShadow: isHighlighted 
          ? '0 0 8px rgba(12, 242, 180, 0.3)' 
          : isCore 
          ? '0 0 8px rgba(12, 242, 180, 0.4)' 
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
          border: '1px solid rgba(12, 242, 180, 0.3)',
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
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(12, 242, 180, 0.1) inset',
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
    stroke: 'rgba(12, 242, 180, 0.6)',
    strokeWidth: 2,
  },
  markerEnd: 'arrowclosed' as const,
};

const MeshSDKArchitectureChart: React.FC<MeshSDKArchitectureChartProps> = ({ height = 600, highlightedNodeId, onNodeClick }) => {
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Handle node click
  const handleNodeClick = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setClickedNodeId(nodeId);
    setButtonPosition(position);
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [onNodeClick]);

  // Define node types with highlighted node prop
  const nodeTypes = useMemo(() => ({
    sdkPackage: (props: NodeProps) => <SDKPackageNode {...props} highlightedNodeId={highlightedNodeId} onNodeClick={handleNodeClick} />,
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

  // Get the clicked node data
  const clickedNode = clickedNodeId ? meshSDKNodes.find(node => node.id === clickedNodeId) : null;

  // Handle "Go to" button click
  const handleGoToClick = () => {
    if (clickedNode?.url) {
      window.open(clickedNode.url, '_blank');
    }
    setClickedNodeId(null);
    setButtonPosition(null);
  };

  // Close button on outside click
  const handleContainerClick = () => {
    setClickedNodeId(null);
    setButtonPosition(null);
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height, 
        background: 'transparent',
        position: 'relative',
      }}
      onClick={handleContainerClick}
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
        }}
      >
        <Background
          color="rgba(12, 242, 180, 0.1)"
          gap={20}
          size={1}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </ReactFlow>

      {/* Go to button */}
      {clickedNodeId && buttonPosition && clickedNode?.url && (
        <div
          style={{
            position: 'absolute',
            left: buttonPosition.x,
            top: buttonPosition.y,
            zIndex: 1000,
            background: 'linear-gradient(135deg, rgba(12, 242, 180, 0.9) 0%, rgba(56, 232, 225, 0.8) 100%)',
            border: '1px solid rgba(12, 242, 180, 1)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: 'rgba(0, 0, 0, 0.9)',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(12, 242, 180, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleGoToClick();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(12, 242, 180, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(12, 242, 180, 0.4)';
          }}
        >
          Go to
        </div>
      )}
    </div>
  );
};

// =====================================================
// CAROUSEL COMPONENT
// =====================================================

const MeshSDKCarousel: React.FC<MeshSDKCarouselProps> = ({ onNodeSelect, meshPackagesData, highlightedNodeId }) => {
  // Start with core at index 0, so it appears as the center card
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = currentIndex === 0 ? meshSDKNodes.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[newIndex].id);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = (currentIndex + 1) % meshSDKNodes.length;
    setCurrentIndex(newIndex);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[newIndex].id);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleCardClick = (node: typeof meshSDKNodes[0]) => {
    if (node.url) {
      window.open(node.url, '_blank');
    }
    if (onNodeSelect) {
      onNodeSelect(node.id);
    }
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[index].id);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const getCategoryColor = (category: string, isCore: boolean) => {
    // All cards use the same background as the page
    return {
      background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textColor: 'rgba(12, 242, 180, 0.9)',
    };
  };

  // Get download count for a package
  const getPackageDownloads = (packageLabel: string) => {
    if (!meshPackagesData?.packages) return 0;
    
    const packageName = packageLabel; // e.g., '@meshsdk/core'
    const pkg = meshPackagesData.packages.find((p: any) => p.name === packageName);
    
    if (!pkg) return 0;
    
    // Use the sum of all monthly_downloads data for total historical downloads
    if (pkg.monthly_downloads && Array.isArray(pkg.monthly_downloads)) {
      return pkg.monthly_downloads.reduce((total: number, month: any) => {
        return total + (month.downloads || 0);
      }, 0);
    }
    
    // Fallback to last_year_downloads if monthly data is not available
    return pkg.last_year_downloads || 0;
  };

  // Get tags for a package based on its properties and category
  const getPackageTags = (cardData: any) => {
    const tags = [];
    
    // Add category-based tags
    if (cardData.category === 'Core') {
      tags.push('Core');
    } else if (cardData.category === 'Application') {
      tags.push('App Layer');
    }
    
    // Add specific functionality tags based on package name/description
    if (cardData.id === 'core') {
      tags.push('All-in-One', 'SDK Entry');
    } else if (cardData.id === 'react') {
      tags.push('React', 'Components', 'UI');
    } else if (cardData.id === 'transaction') {
      tags.push('Transactions', 'Smart Contracts');
    } else if (cardData.id === 'wallet') {
      tags.push('Wallets', 'Assets');
    } else if (cardData.id === 'provider') {
      tags.push('Data Provider');
    } else if (cardData.id === 'contract') {
      tags.push('Smart Contracts', 'DApps');
    } else if (cardData.id === 'common') {
      tags.push('Types', 'Interfaces');
    } else if (cardData.id === 'core_csl') {
      tags.push('Serialization', 'Low-level');
    } else if (cardData.id === 'core_cst') {
      tags.push('Cardano SDK', 'Low-level');
    }
    
    return tags.slice(0, 3); // Limit to 3 tags max
  };

  // Calculate card scale based on position from center
  const getCardScale = (position: number) => {
    const absPos = Math.abs(position);
    if (absPos === 0) return 1; // Center card
    if (absPos === 1) return 0.9; // Adjacent cards
    if (absPos === 2) return 0.8; // Second layer
    return 0.7; // Further cards
  };

  // Calculate card opacity based on position
  const getCardOpacity = (position: number, isVisible: boolean) => {
    if (!isVisible) return 0;
    const absPos = Math.abs(position);
    if (absPos === 0) return 1; // Center card
    if (absPos === 1) return 0.8; // Adjacent cards
    if (absPos === 2) return 0.5; // Second layer
    return 0.3; // Further cards
  };

  // Calculate vertical offset for stacking effect
  const getCardYOffset = (position: number) => {
    const absPos = Math.abs(position);
    if (absPos === 0) return 0; // Center card
    if (absPos === 1) return 15; // Adjacent cards
    if (absPos === 2) return 25; // Second layer
    return 35; // Further cards
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate all cards with their positions for smooth sliding
  const getAllCardsWithPositions = () => {
    return meshSDKNodes.map((node, index) => {
      // Calculate position relative to current center
      let position = index - currentIndex;
      
      // Handle wrapping for smooth infinite scroll
      if (position > meshSDKNodes.length / 2) {
        position -= meshSDKNodes.length;
      } else if (position < -meshSDKNodes.length / 2) {
        position += meshSDKNodes.length;
      }
      
      return {
        ...node,
        position,
        index
      };
    });
  };

  // Get the center card (highlighted one)
  const getCenterCardIndex = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    return isMobile ? 0 : 1; // Center card is index 1 on desktop, 0 on mobile
  };

  // Trigger highlight on mount and when currentIndex changes
  React.useEffect(() => {
    const currentCard = meshSDKNodes[currentIndex];
    if (currentCard && onNodeSelect) {
      onNodeSelect(currentCard.id);
    }
  }, [currentIndex, onNodeSelect]);

  // Update carousel when external node is clicked
  React.useEffect(() => {
    if (highlightedNodeId) {
      const nodeIndex = meshSDKNodes.findIndex(node => node.id === highlightedNodeId);
      if (nodeIndex !== -1 && nodeIndex !== currentIndex) {
        setCurrentIndex(nodeIndex);
      }
    }
  }, [highlightedNodeId, currentIndex]);

  // Handle window resize for responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="carousel">

      <div className="carouselContainer" ref={carouselRef}>
        <button 
          className={`navButton navButtonPrev ${isTransitioning ? 'navButtonDisabled' : ''}`}
          onClick={handlePrevious}
          disabled={isTransitioning}
          aria-label="Previous package"
        >
          <FaChevronLeft />
        </button>

        <div className="cardsContainer">
          <div className="cardsTrack">
            {getAllCardsWithPositions().map((cardData) => {
              const colorScheme = getCategoryColor(cardData.category, cardData.isCore);
              const isCenter = cardData.position === 0;
              const isVisible = isMobile ? cardData.position === 0 : Math.abs(cardData.position) <= 2; // Show only center on mobile, center + 2 on each side on desktop
              
              return (
                <div
                  key={cardData.id}
                  className={`card ${isCenter ? 'cardCenter' : ''} ${cardData.position < 0 ? 'cardPrev' : ''} ${cardData.position > 0 ? 'cardNext' : ''}`}
                  style={{
                    background: colorScheme.background,
                    border: colorScheme.border,
                    transform: `translateX(${cardData.position * (isMobile ? 280 : 200)}px) scale(${getCardScale(cardData.position)}) translateY(${getCardYOffset(cardData.position)}px)`,
                    opacity: getCardOpacity(cardData.position, isVisible),
                    zIndex: 10 - Math.abs(cardData.position),
                    transition: isTransitioning ? 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'all 0.3s ease',
                    pointerEvents: isVisible ? 'auto' : 'none'
                  }}
                  onClick={() => handleCardClick(cardData)}
                >
                  <div className="cardHeader">
                    <div className="cardCategory" style={{ color: colorScheme.textColor }}>
                      {cardData.label}
                    </div>
                    {cardData.url && (
                      <div className="cardIcon">
                        <FaExternalLinkAlt size={12} />
                      </div>
                    )}
                  </div>
                  
                  <div className="cardContent">
                    <p className="cardDescription">
                      {cardData.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="cardTags">
                      {getPackageTags(cardData).map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Downloads metric */}
                     <div className="cardMetric">
                       <span className="metricLabel">Total Downloads</span>
                       <span className="metricValue">
                         {formatNumber(getPackageDownloads(cardData.label))}
                       </span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          className={`navButton navButtonNext ${isTransitioning ? 'navButtonDisabled' : ''}`}
          onClick={handleNext}
          disabled={isTransitioning}
          aria-label="Next package"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="pagination">
        {meshSDKNodes.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'dotActive' : ''} ${isTransitioning ? 'dotDisabled' : ''}`}
            onClick={() => handleDotClick(index)}
            disabled={isTransitioning}
            aria-label={`Go to package ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

// =====================================================
// EXPORTS
// =====================================================

export { MeshSDKCarousel, MeshSDKArchitectureChart };
export default MeshSDKCarousel;

// =====================================================
// CSS STYLES - ADD TO YOUR STYLESHEET
// =====================================================

/*
Add the following CSS to your stylesheet or create a separate CSS file:

.carousel {
  width: 100%;
  margin-bottom: 2rem;
}

.carouselHeader {
  text-align: center;
  margin-bottom: 2rem;
}

.carouselTitle {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(90deg, rgba(12, 242, 180, 0.9) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(12, 242, 180, 0.9) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gradientText 3s ease infinite;
}

.carouselSubtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
}

@keyframes gradientText {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.carouselContainer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.navButton {
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.15) 0%, rgba(56, 232, 225, 0.1) 100%);
  border: 1px solid rgba(12, 242, 180, 0.3);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(12, 242, 180, 0.9);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  flex-shrink: 0;
  z-index: 2;
}

.navButton:hover {
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.25) 0%, rgba(56, 232, 225, 0.2) 100%);
  border-color: rgba(12, 242, 180, 0.5);
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 12px 30px rgba(12, 242, 180, 0.4);
}

.navButton:active {
  transform: translateY(-1px) scale(1.02);
}

.navButtonDisabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.navButtonPrev {
  order: 1;
}

.navButtonNext {
  order: 3;
}

.card {
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  height: 280px;
  width: 280px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  position: absolute;
  overflow: hidden;
  will-change: transform, opacity, filter;
  transform-origin: center center;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(12, 242, 180, 0.05) 0%, transparent 60%),
    radial-gradient(circle at 80% 80%, rgba(56, 232, 225, 0.03) 0%, transparent 60%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card:hover::before {
  opacity: 1;
}

.cardCenter::before {
  opacity: 0.5;
}

.cardCenter {
  z-index: 10;
}

.cardPrev,
.cardNext {
  z-index: 5;
}

.card:hover {
  border-color: rgba(12, 242, 180, 0.3);
  box-shadow: 
    0 16px 40px rgba(0, 0, 0, 0.4),
    0 8px 20px rgba(12, 242, 180, 0.15),
    0 0 0 1px rgba(12, 242, 180, 0.1) inset;
}

.cardCenter:hover {
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 10px 25px rgba(12, 242, 180, 0.2),
    0 0 0 1px rgba(12, 242, 180, 0.15) inset;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.cardCategory {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.cardIcon {
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

.card:hover .cardIcon {
  color: rgba(12, 242, 180, 0.8);
}

.cardContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cardTitle {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
}

.cardDescription {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
}

.cardTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.12) 0%, rgba(56, 232, 225, 0.08) 100%);
  border: 1px solid rgba(12, 242, 180, 0.2);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(12, 242, 180, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  transition: all 0.3s ease;
}

.card:hover .tag {
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.18) 0%, rgba(56, 232, 225, 0.12) 100%);
  border-color: rgba(12, 242, 180, 0.3);
  transform: translateY(-1px);
}

.cardMetric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.08) 0%, rgba(56, 232, 225, 0.04) 100%);
  border: 1px solid rgba(12, 242, 180, 0.15);
  border-radius: 8px;
  margin-top: auto;
}

.metricLabel {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.metricValue {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(12, 242, 180, 1);
  text-shadow: 0 0 8px rgba(12, 242, 180, 0.3);
}

.coreIndicator {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, rgba(12, 242, 180, 0.9) 0%, rgba(56, 232, 225, 0.8) 100%);
  color: rgba(0, 0, 0, 0.8);
  font-size: 0.625rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(12, 242, 180, 0.3);
}

.coreIndicator span {
  text-shadow: none;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto 1rem auto;
  padding: 0 2rem;
}

.dot {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin: 0 2px;
}

.dot:hover {
  background: rgba(12, 242, 180, 0.5);
  transform: scaleY(1.5);
}

.dotActive {
  background: rgba(12, 242, 180, 0.9);
  transform: scaleY(2);
  box-shadow: 0 0 8px rgba(12, 242, 180, 0.4);
}

.dotDisabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.cardsContainer {
  flex: 1;
  order: 2;
  overflow: hidden;
  perspective: 1200px;
  position: relative;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cardsTrack {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

@media (max-width: 768px) {
  .carousel {
    margin-bottom: 1.5rem;
  }

  .carouselHeader {
    margin-bottom: 1.5rem;
  }

  .carouselTitle {
    font-size: 1.25rem;
  }

  .carouselContainer {
    gap: 0.5rem;
  }

  .navButton {
    width: 40px;
    height: 40px;
  }

  .cardsContainer {
    height: 240px;
  }

  .pagination {
    max-width: 280px;
    padding: 0 1rem;
  }

  .card {
    height: 220px;
    padding: 1.25rem;
    width: 260px;
    position: relative;
  }

  .cardTitle {
    font-size: 0.9rem;
  }

  .cardDescription {
    font-size: 0.8rem;
  }

  .cardTags {
    gap: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .tag {
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }

  .coreIndicator {
    top: 8px;
    right: 8px;
    font-size: 0.5rem;
    padding: 3px 6px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .card {
    max-width: 240px;
    height: 200px;
    padding: 1.25rem;
  }

  .cardTitle {
    font-size: 0.9rem;
  }
}
*/
