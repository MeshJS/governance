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

export default function ManageProjects() {
    const router = useRouter();
    const { sessionAddress, connectedWallet } = useWallet();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [, setListError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
    const [isEditorsOpen, setIsEditorsOpen] = useState(false);
    const [editEditorsProject, setEditEditorsProject] = useState<ProjectRecord | null>(null);
    const [isMintOpen, setIsMintOpen] = useState(false);
    const [mintProject, setMintProject] = useState<ProjectRecord | null>(null);

    const closeModal = useCallback(async () => {
        if (router.asPath.includes('?')) {
            try {
                await router.replace('/projects/manage', undefined, { shallow: true });
            } catch {
                // ignore navigation errors
            }
        }
        setIsFormOpen(false);
        setEditingProject(null);
    }, [router]);

    const loadProjects = useCallback(async () => {
        if (!sessionAddress) {
            setProjects([]);
            return;
        }
        setIsLoading(true);
        setListError(null);
        try {
            const query = '/api/projects?only_editable=true&include_inactive=true';
            const resp = await fetch(query, { credentials: 'same-origin' });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || 'Failed to load projects');
            const list = data.projects ?? [];
            setProjects(list);
        } catch (e) {
            setListError(e instanceof Error ? e.message : 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [sessionAddress]);

    // Re-fetch once a wallet is actually connected so NFT units are included
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

    // owner check now handled server-side; admins can also manage

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
        if (!confirm('This will permanently delete the project and its roles. This action cannot be undone. Are you sure?')) return;
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
                                                <td>{p.can_edit
                                                    ? <button className={styles.linkBtn} onClick={() => onEdit(p)}>Edit</button>
                                                    : <span className={styles.muted}>No access</span>}
                                                </td>
                                                <td>{(p.my_role === 'owner' || p.my_role === 'admin')
                                                    ? <button className={styles.linkBtn} onClick={() => onManageEditors(p)}>Edit</button>
                                                    : <span className={styles.muted}>Owner/Admin only</span>}
                                                </td>
                                                <td>{p.my_role === 'owner'
                                                    ? <button className={styles.linkBtn} onClick={() => onMintRoleNfts(p)}>Mint</button>
                                                    : <span className={styles.muted}>Owner only</span>}
                                                </td>
                                                <td>{p.my_role === 'owner'
                                                    ? <button className={styles.linkBtnDanger} onClick={() => onDelete(p.id)}>Delete</button>
                                                    : <span className={styles.muted}>Owner only</span>}
                                                </td>
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
                    canSubmit={Boolean(sessionAddress)}
                    onClose={() => setIsEditorsOpen(false)}
                />

                <MintRoleNftModal
                    isOpen={isMintOpen}
                    project={mintProject}
                    canSubmit={Boolean(sessionAddress)}
                    onClose={() => setIsMintOpen(false)}
                />
            </main>
        </div>
    );
}


