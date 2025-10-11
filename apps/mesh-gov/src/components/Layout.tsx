import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Navigation from './Navigation';
import styles from '../styles/Layout.module.css';
import Image from 'next/image';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(250);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Check if we're on a proposal detail page
  const isDRepProposalDetailPage = router.pathname === '/drep-voting/[proposalId]';
  const isCatalystProposalDetailPage = router.pathname === '/catalyst-proposals/[id]';
  const isProposalDetailPage = isDRepProposalDetailPage || isCatalystProposalDetailPage;
  const isMeshStatsPage = router.pathname === '/mesh-stats';
  
  // State for package legend data
  const [packageLegendData, setPackageLegendData] = useState<Array<{ name: string; color: string; packageName: string; downloads: number }>>([]);
  const [isChartHovered, setIsChartHovered] = useState(false);

  // Listen for legend data updates from the mesh-stats page
  React.useEffect(() => {
    const handleLegendUpdate = () => {
      const legendElement = document.querySelector('[data-package-legend]');
      if (legendElement) {
        const legendData = legendElement.getAttribute('data-package-legend');
        if (legendData) {
          try {
            setPackageLegendData(JSON.parse(legendData));
          } catch (e) {
            console.error('Failed to parse legend data:', e);
          }
        }
        
        const hoverData = legendElement.getAttribute('data-chart-hovered');
        if (hoverData) {
          setIsChartHovered(hoverData === 'true');
        }
      }
    };

    if (isMeshStatsPage) {
      const observer = new MutationObserver(handleLegendUpdate);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['data-package-legend'] 
      });
      return () => observer.disconnect();
    } else {
      setPackageLegendData([]);
    }
  }, [isMeshStatsPage]);

  const handleBackClick = () => {
    if (isDRepProposalDetailPage) {
      router.push('/drep-voting');
    } else if (isCatalystProposalDetailPage) {
      router.push('/catalyst-proposals');
    }
  };

  const handleMouseDown = useCallback((side: 'left' | 'right') => {
    setIsResizing(side);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !layoutRef.current) return;

    const rect = layoutRef.current.getBoundingClientRect();
    const containerWidth = rect.width;

    if (isResizing === 'left') {
      const newWidth = Math.max(150, Math.min(600, e.clientX - rect.left));
      setLeftWidth(newWidth);
    } else if (isResizing === 'right') {
      const newWidth = Math.max(150, Math.min(600, rect.right - e.clientX));
      setRightWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={styles.container}>
      <Navigation />
      <div className={styles.layoutWrapper} ref={layoutRef}>
        <aside 
          className={styles.leftSidebar}
          style={{ width: `${leftWidth}px` }}
        >
          {/* Back button for proposal detail pages */}
          {isProposalDetailPage && (
            <div className={styles.backButtonContainer}>
              <button 
                className={styles.backButton}
                onClick={handleBackClick}
                type="button"
                aria-label="Back to previous page"
              >
                <span>BACK</span>
              </button>
            </div>
          )}
          
          {/* Package Legend for Mesh Stats page */}
          {isMeshStatsPage && packageLegendData.length > 0 && (
            <div className={`${styles.packageLegendWrapper} ${isChartHovered ? styles.visible : styles.hidden}`}>
              <div className={styles.packageLegendTopBar} />
              <div className={styles.packageLegendContent}>
                <h3 className={styles.legendTitle}>Package Downloads</h3>
                <div className={styles.legendItems}>
                  {packageLegendData.map((item, index) => (
                    <div 
                      key={item.name}
                      className={styles.legendItem}
                      onClick={() => {
                        const npmUrl = `https://www.npmjs.com/package/${item.packageName}`;
                        window.open(npmUrl, '_blank');
                      }}
                    >
                      <div 
                        className={styles.legendColor}
                        style={{ backgroundColor: item.color }}
                      />
                      <div className={styles.legendText}>
                        <span className={styles.legendName}>{item.name}</span>
                        <span className={styles.legendValue}>
                          {new Intl.NumberFormat('en-US').format(item.downloads)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.packageLegendBottomBar} />
            </div>
          )}
          
          {/* Left sidebar content - can be populated later */}
          <div 
            className={styles.resizeHandle}
            onMouseDown={() => handleMouseDown('left')}
            data-side="right"
          />
        </aside>
        
        <main 
          className={styles.main}
          style={{ 
            marginLeft: `${leftWidth}px`,
            marginRight: `${rightWidth}px`
          }}
        >
          <div className={styles.content}>{children}</div>
        </main>
        
        <aside 
          className={styles.rightSidebar}
          style={{ width: `${rightWidth}px` }}
        >
          <div 
            className={styles.resizeHandle}
            onMouseDown={() => handleMouseDown('right')}
            data-side="left"
          />
          {/* Right sidebar content - can be populated later */}
          <div className={styles.cardanoSection}>
            <p className={styles.tagline}>Building On Cardano</p>
            <Link
              href="https://cardano.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cardanoLogo}
            >
              <div className={styles.logoOrbit}></div>
              <div className={styles.logoOrbitInner}></div>
              <Image
                src="/Cardano-RGB_Logo-Icon-White.png"
                alt="Cardano Logo"
                width={40}
                height={40}
                priority
              />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
