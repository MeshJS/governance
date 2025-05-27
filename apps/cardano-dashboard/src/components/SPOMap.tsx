import React, { useRef, useEffect, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useDataContext } from '../contexts/DataContext';
import { SPOData } from '../../types/spo';
import styles from '../styles/Map.module.css';

interface NodeLocation {
    lat: number;
    lng: number;
    pool: SPOData;
}

export const SPOMap: React.FC = () => {
    const { spoData } = useDataContext();
    const globeRef = useRef<GlobeMethods | undefined>(undefined);

    // Memoize the filtered locations to prevent unnecessary recalculations
    const nodeLocations = useMemo(() =>
        spoData
            .filter((pool): pool is SPOData & { location: { lat: number; lng: number } } => {
                if (!pool.location) return false;
                return typeof pool.location.lat === 'number' &&
                    typeof pool.location.lng === 'number' &&
                    !isNaN(pool.location.lat) &&
                    !isNaN(pool.location.lng);
            })
            .map(pool => ({
                lat: pool.location.lat,
                lng: pool.location.lng,
                pool
            })),
        [spoData]
    );

    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.3;
            globeRef.current.pointOfView({ altitude: 2.5 });
        }
    }, []);

    if (nodeLocations.length === 0) {
        return <div>No SPO locations available</div>;
    }

    return (
        <div className={styles.mapContainer} style={{ height: '600px', width: '100%' }}>
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl=""
                backgroundImageUrl=""
                pointsData={nodeLocations}
                pointLat="lat"
                pointLng="lng"
                pointColor={() => '#ff0000'}
                pointRadius={0.1}
                pointAltitude={0.01}
                pointLabel={(d) => {
                    const node = d as NodeLocation;
                    return `
                        <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 4px;">
                            <h3 style="margin: 0 0 4px 0; font-size: 14px;">${node.pool.meta_json?.name || 'Unknown Pool'}</h3>
                            <p style="margin: 0; font-size: 12px;">${node.pool.ticker} - ${(Number(node.pool.live_stake) / 1e6).toFixed(0)} ₳</p>
                        </div>
                    `;
                }}
                rendererConfig={{
                    antialias: false,
                    alpha: false,
                    powerPreference: 'high-performance'
                }}
                width={800}
                height={600}
                backgroundColor="rgba(0,0,0,1)"
                atmosphereColor="rgba(255,255,255,0.1)"
                atmosphereAltitude={0.05}
            />
        </div>
    );
}; 