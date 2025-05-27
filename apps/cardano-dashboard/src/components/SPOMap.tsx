import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useDataContext } from '../contexts/DataContext';
import { SPOData } from '../../types/spo';
import L from 'leaflet';
import styles from '../styles/Map.module.css';

interface NodeLocation {
    lat: number;
    lng: number;
    pool: SPOData;
}

export const SPOMap: React.FC = () => {
    const { spoData } = useDataContext();

    // Fix for default marker icons in Leaflet with Next.js
    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
    }, []);

    if (!spoData) {
        return <div>Loading SPO data...</div>;
    }

    // Filter pools that have location data
    const nodeLocations: NodeLocation[] = spoData
        .filter((pool): pool is SPOData & { location: { lat: number; lng: number } } =>
            Boolean(pool.location?.lat && pool.location?.lng))
        .map(pool => ({
            lat: pool.location.lat,
            lng: pool.location.lng,
            pool
        }));

    if (nodeLocations.length === 0) {
        return <div>No SPO locations available</div>;
    }

    return (
        <div className={styles.mapContainer}>
            <div className={styles.leafletContainer}>
                <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {nodeLocations.map((location, index) => (
                        <Marker
                            key={`${location.pool.pool_id_bech32}-${index}`}
                            position={[location.lat, location.lng]}
                        >
                            <Popup>
                                <div>
                                    <h3>{location.pool.meta_json?.name || 'Unknown Pool'}</h3>
                                    <p>Ticker: {location.pool.ticker}</p>
                                    <p>Pool ID: {location.pool.pool_id_bech32}</p>
                                    <p>Live Stake: {(Number(location.pool.live_stake) / 1e6).toFixed(2)} ₳</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}; 