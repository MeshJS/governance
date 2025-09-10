import Head from "next/head";
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './manage.module.css';
import { useWallet } from '@/contexts/WalletContext';
import type { ProjectRecord } from '@/types/projects';
import { ProjectEditorModal } from '@/components/projects/ProjectEditorModal';
import { EditorsModal } from '@/components/projects/EditorsModal';
import { MintRoleNftModal } from '@/components/projects/MintRoleNftModal';
// address helpers not needed in this view currently

export default function ManageProjects() {
    const router = useRouter();
    const { sessionAddress, getFingerprints, connectedWallet } = useWallet();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [, setListError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
    const [isEditorsOpen, setIsEditorsOpen] = useState(false);
    const [editEditorsProject, setEditEditorsProject] = useState<ProjectRecord | null>(null);
    const [isMintOpen, setIsMintOpen] = useState(false);
    const [mintProject, setMintProject] = useState<ProjectRecord | null>(null);
    const [sessionFingerprints, setSessionFingerprints] = useState<string[]>([]);

    const closeModal = useCallback(() => {
        setIsFormOpen(false);
        setEditingProject(null);
        if (router.asPath.includes('?')) {
            router.replace('/projects/manage', undefined, { shallow: true }).catch(() => { });
        }
    }, [router]);

    const loadProjects = useCallback(async () => {
        if (!sessionAddress) {
            setProjects([]);
            return;
        }
        setIsLoading(true);
        setListError(null);
        try {
            let query = '/api/projects?only_editable=true&include_inactive=true';
            // Attach fingerprints if available to enable NFT-based access
            try {
                const fps = await getFingerprints();
                if (Array.isArray(fps) && fps.length > 0) {
                    setSessionFingerprints(fps);
                    query += `&nft_fingerprints=${encodeURIComponent(fps.join(','))}`;
                } else {
                    setSessionFingerprints([]);
                }
            } catch {
                setSessionFingerprints([]);
            }
            const resp = await fetch(query, { credentials: 'same-origin' });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || 'Failed to load projects');
            setProjects(data.projects ?? []);
        } catch (e) {
            setListError(e instanceof Error ? e.message : 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [sessionAddress, getFingerprints]);

    // Re-fetch once a wallet is actually connected so NFT fingerprints are included
    useEffect(() => {
        if (!sessionAddress) return;
        if (!connectedWallet?.wallet) return;
        void loadProjects();
    }, [sessionAddress, connectedWallet?.wallet, loadProjects]);

    // Close modal on wallet disconnect and remove any ?edit=
    useEffect(() => {
        if (!router.isReady) return;
        if (sessionAddress) return;
        closeModal();
        setIsEditorsOpen(false);
        setEditEditorsProject(null);
        setProjects([]);
    }, [router.isReady, sessionAddress, closeModal]);

    const onEdit = useCallback((p: ProjectRecord) => {
        setEditingProject(p);
        setIsFormOpen(true);
    }, []);

    const onManageEditors = useCallback((p: ProjectRecord) => {
        setEditEditorsProject(p);
        setIsEditorsOpen(true);
    }, []);

    const onMintRoleNfts = useCallback((p: ProjectRecord) => {
        setMintProject(p);
        setIsMintOpen(true);
    }, []);

    const isOwnerOf = useCallback((p: ProjectRecord | null | undefined): boolean => {
        if (!p || !sessionAddress) return false;
        if (Array.isArray(p.owner_wallets) && p.owner_wallets.includes(sessionAddress)) return true;
        if (Array.isArray(p.owner_nft_fingerprints) && sessionFingerprints.length > 0) {
            const fpSet = new Set(sessionFingerprints);
            if (p.owner_nft_fingerprints.some((fp) => !!fp && fpSet.has(fp))) return true;
        }
        return false;
    }, [sessionAddress, sessionFingerprints]);

    // Auto-enter edit mode when arriving with ?edit=<slug|id>
    useEffect(() => {
        if (!router.isReady) return;
        const q = router.query?.edit;
        if (!q || isFormOpen) return;
        const queryVal = Array.isArray(q) ? q[0] : q;
        if (!queryVal) return;
        const match = projects.find((p) => p.id === queryVal || p.slug === queryVal);
        if (match) onEdit(match);
    }, [router.isReady, router.query?.edit, projects, isFormOpen, onEdit]);

    const onDelete = useCallback(async (id: string) => {
        if (!confirm('Delete this project?')) return;
        try {
            const resp = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data?.error || 'Delete failed');
            }
            await loadProjects();
            if (editingProject?.id === id) closeModal();
        } catch {
            // ignore; keep last listError
        }
    }, [editingProject?.id, loadProjects, closeModal]);

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Manage Cardano Projects | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Manage Cardano Projects</h1>
                <div className={styles.actions} style={{ marginBottom: 12 }}>
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
                        disabled={!sessionAddress}
                    >
                        Add Project
                    </button>
                </div>

                {sessionAddress ? (
                    <div className={pageStyles.section}>
                        <h2 className={styles.sectionTitle}>Projects</h2>
                        {isLoading ? (
                            <p>Loading…</p>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Slug</th>
                                            <th>Active</th>
                                            <th>URL</th>
                                            <th>Edit Project details</th>
                                            <th>Edit roles/editors</th>
                                            <th>Mint Role NFTs</th>
                                            <th>Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.name}</td>
                                                <td>{p.slug}</td>
                                                <td>{p.is_active ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <a href={`/projects/${encodeURIComponent(p.slug)}`}>link</a>
                                                </td>
                                                <td><button className={styles.linkBtn} onClick={() => onEdit(p)}>Edit</button></td>
                                                <td>{isOwnerOf(p)
                                                    ? <button className={styles.linkBtn} onClick={() => onManageEditors(p)}>Edit</button>
                                                    : <span className={styles.muted}>Owners only</span>}
                                                </td>
                                                <td>{isOwnerOf(p)
                                                    ? <button className={styles.linkBtn} onClick={() => onMintRoleNfts(p)}>Mint</button>
                                                    : <span className={styles.muted}>Owners only</span>}
                                                </td>
                                                <td><button className={styles.linkBtnDanger} onClick={() => onDelete(p.id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {projects.length === 0 && <p className={styles.muted}>No projects yet.</p>}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={pageStyles.section}>
                        <h2 className={styles.sectionTitle}>Projects</h2>
                        <p className={styles.muted}>Connect a wallet to manage your projects.</p>
                    </div>
                )}

                {/* Removed second table; roles/editors are managed via button in main table */}

                <ProjectEditorModal
                    isOpen={isFormOpen}
                    project={editingProject}
                    canSubmit={Boolean(sessionAddress)}
                    onClose={closeModal}
                    onSaved={loadProjects}
                />

                <EditorsModal
                    isOpen={isEditorsOpen}
                    project={editEditorsProject}
                    canSubmit={Boolean(sessionAddress) && isOwnerOf(editEditorsProject)}
                    onClose={() => setIsEditorsOpen(false)}
                />

                <MintRoleNftModal
                    isOpen={isMintOpen}
                    project={mintProject}
                    canSubmit={Boolean(sessionAddress) && isOwnerOf(mintProject)}
                    onClose={() => setIsMintOpen(false)}
                />
            </main>
        </div>
    );
}


