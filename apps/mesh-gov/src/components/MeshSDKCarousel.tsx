import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/MeshSDKComponents.module.css';
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';

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

interface MeshSDKCarouselProps {
  onNodeSelect?: (nodeId: string) => void;
  meshPackagesData?: any;
  highlightedNodeId?: string;
}

const MeshSDKCarousel: React.FC<MeshSDKCarouselProps> = ({ onNodeSelect, meshPackagesData, highlightedNodeId }) => {
  // Find the index of the core package to set as initial center
  const coreIndex = meshSDKNodes.findIndex(node => node.id === 'core');
  const [currentIndex, setCurrentIndex] = useState(coreIndex !== -1 ? coreIndex : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExternalUpdate, setIsExternalUpdate] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? meshSDKNodes.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[newIndex].id);
    }
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % meshSDKNodes.length;
    setCurrentIndex(newIndex);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[newIndex].id);
    }
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
    if (index === currentIndex) return;
    setCurrentIndex(index);
    if (onNodeSelect) {
      onNodeSelect(meshSDKNodes[index].id);
    }
  };

  const getCategoryColor = (category: string, isCore: boolean, id: string) => {
    // Make the core package stand out more
    if (id === 'core') {
      return {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.15) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        textColor: 'rgba(255, 255, 255, 1)',
      };
    }
    
    // All other cards use the same background as the page
    return {
      background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textColor: 'rgba(255, 255, 255, 0.9)',
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

  // Trigger highlight on mount and when currentIndex changes (but not during external updates)
  React.useEffect(() => {
    if (!isExternalUpdate) {
      const currentCard = meshSDKNodes[currentIndex];
      if (currentCard && onNodeSelect) {
        onNodeSelect(currentCard.id);
      }
    }
  }, [currentIndex, onNodeSelect, isExternalUpdate]);

  // Update carousel when external node is clicked (from architecture chart)
  
  React.useEffect(() => {
    if (highlightedNodeId) {
      const nodeIndex = meshSDKNodes.findIndex(node => node.id === highlightedNodeId);
      if (nodeIndex !== -1 && nodeIndex !== currentIndex) {
        setIsExternalUpdate(true);
        setCurrentIndex(nodeIndex);
        // Reset flag after update
        setTimeout(() => {
          setIsExternalUpdate(false);
        }, 50);
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
    <div className={styles.carousel}>
      <div className={styles.carouselContainer} ref={carouselRef}>
        <button 
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          onClick={handlePrevious}
          aria-label="Previous package"
        >
          <FaChevronLeft />
        </button>

        <div className={styles.cardsContainer}>
          <div className={styles.cardsTrack}>
            {getAllCardsWithPositions().map((cardData) => {
              const colorScheme = getCategoryColor(cardData.category, cardData.isCore, cardData.id);
              const isCenter = cardData.position === 0;
              const isVisible = isMobile ? cardData.position === 0 : Math.abs(cardData.position) <= 2; // Show only center on mobile, center + 2 on each side on desktop
              
              return (
                <div
                  key={cardData.id}
                  className={`${styles.card} ${isCenter ? styles.cardCenter : ''} ${cardData.position < 0 ? styles.cardPrev : ''} ${cardData.position > 0 ? styles.cardNext : ''}`}
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
                  <div className={styles.cardHeader}>
                    <div className={styles.cardCategory} style={{ color: colorScheme.textColor }}>
                      {cardData.label}
                    </div>
                    {cardData.url && (
                      <div className={styles.cardIcon}>
                        <FaExternalLinkAlt size={12} />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.cardContent}>
                    <p className={styles.cardDescription}>
                      {cardData.description}
                    </p>
                    
                    {/* Tags */}
                    <div className={styles.cardTags}>
                      {getPackageTags(cardData).map((tag, tagIndex) => (
                        <span key={tagIndex} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Downloads metric */}
                     <div className={styles.cardMetric}>
                       <span className={styles.metricLabel}>Total Downloads</span>
                       <span className={styles.metricValue}>
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
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={handleNext}
          aria-label="Next package"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Pagination dots with core at center position */}
      <div className={styles.pagination}>
        {(() => {
          // Find the core index
          const coreIndex = meshSDKNodes.findIndex(node => node.id === 'core');
          // Calculate middle dot position
          const middlePosition = Math.floor(meshSDKNodes.length / 2);
          // Calculate shift needed to put core in the middle
          const shift = middlePosition - coreIndex;
          
          return meshSDKNodes.map((node, index) => {
            // Calculate the actual node index this dot represents
            let actualIndex = (index - shift) % meshSDKNodes.length;
            if (actualIndex < 0) actualIndex += meshSDKNodes.length;
            
            return (
              <button
                key={index}
                className={`${styles.dot} ${actualIndex === currentIndex ? styles.dotActive : ''}`}
                onClick={() => handleDotClick(actualIndex)}
                aria-label={`Go to package ${meshSDKNodes[actualIndex].label}`}
              />
            );
          });
        })()}
      </div>
    </div>
  );
};

export default MeshSDKCarousel;
