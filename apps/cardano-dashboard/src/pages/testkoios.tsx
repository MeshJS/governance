import React, { useState } from 'react';

interface KoiosResponse {
    [key: string]: unknown;
}

export default function TestKoios() {
    const [result, setResult] = useState<KoiosResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/testkoios');
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Unknown error');
                setResult(data.details || null);
            } else {
                setResult(data);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Fetch error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 32 }}>
            <h1>Test Koios API</h1>
            <button onClick={handleTest} disabled={loading} style={{ marginBottom: 16 }}>
                {loading ? 'Testing...' : 'Test /api/testkoios'}
            </button>
            {error && (
                <div style={{ color: 'red', marginBottom: 16 }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            {result && (
                <pre style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
} 