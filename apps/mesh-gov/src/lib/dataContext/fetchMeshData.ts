/**
 * Fetches mesh data for use in DataContext.
 * Accepts context-specific helpers and state setters as arguments.
 */
import { MeshData, MeshPackagesApiResponse } from '../../types';
import config from '../../../config';

const npmPackages = config.npmPackages;

export async function fetchMeshDataForContext({
  safeSetItem,
  setMeshData,
  setError,
  MESH_STORAGE_KEY,
}: {
  getCurrentYear: () => number;
  safeSetItem: (key: string, value: string) => void;
  setMeshData: (data: MeshData | null) => void;
  setError: (err: string | null) => void;
  MESH_STORAGE_KEY: string;
}) {
  try {
    // Fetch from new /api/packages endpoint
    let meshPackagesData: MeshPackagesApiResponse | null = null;
    try {
      const packageNames = npmPackages.map(pkg => pkg.name).join(',');
      const res = await fetch(`/api/packages?names=${encodeURIComponent(packageNames)}`);
      if (res.ok) {
        meshPackagesData = await res.json();
      } else {
        console.error('Failed to fetch meshPackagesData:', res.statusText);
      }
    } catch (error) {
      console.error('Error fetching meshPackagesData:', error);
    }

    if (!meshPackagesData) {
      throw new Error('No mesh data available');
    }

    const newData: MeshData = {
      lastFetched: Date.now(),
      meshPackagesData,
    };

    safeSetItem(MESH_STORAGE_KEY, JSON.stringify(newData));
    setMeshData(newData);
    setError(null);
  } catch (err) {
    console.error('Error fetching mesh data:', err);
    setError('Failed to fetch mesh data');
    setMeshData(null);
  }
}
