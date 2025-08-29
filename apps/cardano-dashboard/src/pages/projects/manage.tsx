import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './manage.module.css';
import { useWallet } from '@/contexts/WalletContext';

type ProjectInput = {
    id?: string;
    slug: string;
    name: string;
    description: string;
    url: string;
    icon_url: string;
    category: string;
    is_active: boolean;
};

type ProjectRecord = ProjectInput & {
    id: string;
    created_at: string;
    updated_at: string;
    config?: unknown;
};

type Logo = { src: string; width: number; height: number };
type MainOrganization = {
    name: string;
    displayName: string;
    logo: Logo;
    logoWithName: Logo;
    excludedRepos: string[];
};
type ExtendedOrganization = { name: string; displayName: string; excludedRepos: string[] };
type Repositories = { governance: string; dependentsCountRepo: string };
type DiscordStats = { useApiAction: boolean; description: string };
type NpmPackage = { key: string; name: string; github_package_id?: string; dependents_url?: string };
type SocialLink = { name: string; url: string };
type BuilderProject = { id: string; icon: string; url: string };
type HighlightedProject = { id: string; name: string; description: string; icon: string; url: string; category?: string };
type ShowcaseRepo = { id: string; name: string; description: string; icon: string; url: string; category: string };
type OrgStatsConfig = {
    mainOrganization: MainOrganization;
    extendedOrganizations: ExtendedOrganization[];
    repositories: Repositories;
    poolId: string;
    drepId: string;
    catalystProjectIds: string;
    discordGuildId: string;
    discordStats: DiscordStats;
    npmPackages: NpmPackage[];
    socialLinks: SocialLink[];
    builderProjects: BuilderProject[];
    highlightedProjects: HighlightedProject[];
    showcaseRepos: ShowcaseRepo[];
};

export default function ManageProjects() {
    const router = useRouter();
    const { sessionAddress } = useWallet();
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editors, setEditors] = useState<{ editor_address: string }[]>([]);
    const [newEditor, setNewEditor] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const defaultConfig: OrgStatsConfig = useMemo(() => ({
        mainOrganization: {
            name: '',
            displayName: '',
            logo: { src: '', width: 40, height: 40 },
            logoWithName: { src: '', width: 120, height: 120 },
            excludedRepos: [],
        },
        extendedOrganizations: [],
        repositories: { governance: '', dependentsCountRepo: '' },
        poolId: '',
        drepId: '',
        catalystProjectIds: '',
        discordGuildId: '',
        discordStats: { useApiAction: false, description: '' },
        npmPackages: [],
        socialLinks: [],
        builderProjects: [],
        highlightedProjects: [],
        showcaseRepos: [],
    }), []);
    const [configForm, setConfigForm] = useState<OrgStatsConfig>(defaultConfig);
    const [form, setForm] = useState<ProjectInput>({
        slug: '',
        name: '',
        description: '',
        url: '',
        icon_url: '',
        category: '',
        is_active: true,
    });

    // Keep displayName in sync with project name to avoid duplicate inputs
    useEffect(() => {
        setConfigForm((prev) => {
            if (prev.mainOrganization.displayName === form.name) return prev;
            return {
                ...prev,
                mainOrganization: {
                    ...prev.mainOrganization,
                    displayName: form.name,
                },
            };
        });
    }, [form.name]);

    // Keep icon_url in sync with mainOrganization.logo.src
    useEffect(() => {
        const logoSrc = configForm.mainOrganization.logo.src;
        setForm((prev) => (prev.icon_url === logoSrc ? prev : { ...prev, icon_url: logoSrc }));
    }, [configForm.mainOrganization.logo.src]);

    const resetForm = useCallback(() => {
        setForm({ slug: '', name: '', description: '', url: '', icon_url: '', category: '', is_active: true });
        setEditingId(null);
        setConfigForm(defaultConfig);
        setEditors([]);
        setNewEditor('');
    }, [defaultConfig]);

    const loadProjects = useCallback(async () => {
        if (!sessionAddress) {
            setProjects([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const resp = await fetch('/api/projects?only_editable=true&include_inactive=true');
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || 'Failed to load projects');
            setProjects(data.projects ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [sessionAddress]);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);



    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const onSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const deriveSlug = (projectName: string): string => {
                return (projectName || '').toLowerCase().trim().replace(/\s+/g, '-');
            };
            const derivePackageKey = (pkgName: string): string => {
                if (!pkgName) return '';
                const afterSlash = pkgName.includes('/') ? pkgName.split('/').pop() ?? '' : pkgName;
                return afterSlash.trim();
            };
            const configToSave: OrgStatsConfig = {
                ...configForm,
                npmPackages: configForm.npmPackages.map((pkg) => ({
                    ...pkg,
                    key: derivePackageKey(pkg.name),
                })),
                builderProjects: configForm.builderProjects.map((b, i) => ({
                    ...b,
                    id: `b${i + 1}`,
                })),
                highlightedProjects: configForm.highlightedProjects.map((h) => ({
                    ...h,
                    id: h.name,
                })),
                showcaseRepos: configForm.showcaseRepos.map((r, i) => ({
                    ...r,
                    id: String(i + 1),
                })),
            };
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId
                ? { id: editingId, ...form, slug: deriveSlug(form.name), config: configToSave }
                : { ...form, slug: deriveSlug(form.name), config: configToSave };
            const resp = await fetch('/api/projects', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data?.error || 'Save failed');
            await loadProjects();
            resetForm();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        }
    }, [editingId, form, configForm, loadProjects, resetForm]);

    const onEdit = useCallback((p: ProjectRecord) => {
        setEditingId(p.id);
        setForm({
            slug: p.slug,
            name: p.name,
            description: p.description ?? '',
            url: p.url,
            icon_url: p.icon_url ?? '',
            category: p.category ?? '',
            is_active: p.is_active,
        });
        const cfg = (p.config ?? {}) as Partial<OrgStatsConfig>;
        setConfigForm({
            mainOrganization: {
                name: cfg.mainOrganization?.name ?? '',
                displayName: cfg.mainOrganization?.displayName ?? '',
                logo: {
                    src: cfg.mainOrganization?.logo?.src ?? '',
                    width: cfg.mainOrganization?.logo?.width ?? 40,
                    height: cfg.mainOrganization?.logo?.height ?? 40,
                },
                logoWithName: {
                    src: cfg.mainOrganization?.logoWithName?.src ?? '',
                    width: cfg.mainOrganization?.logoWithName?.width ?? 120,
                    height: cfg.mainOrganization?.logoWithName?.height ?? 120,
                },
                excludedRepos: cfg.mainOrganization?.excludedRepos ?? [],
            },
            extendedOrganizations: cfg.extendedOrganizations ?? [],
            repositories: {
                governance: cfg.repositories?.governance ?? '',
                dependentsCountRepo: cfg.repositories?.dependentsCountRepo ?? '',
            },
            poolId: cfg.poolId ?? '',
            drepId: cfg.drepId ?? '',
            catalystProjectIds: cfg.catalystProjectIds ?? '',
            discordGuildId: cfg.discordGuildId ?? '',
            discordStats: {
                useApiAction: cfg.discordStats?.useApiAction ?? false,
                description: cfg.discordStats?.description ?? '',
            },
            npmPackages: cfg.npmPackages ?? [],
            socialLinks: cfg.socialLinks ?? [],
            builderProjects: cfg.builderProjects ?? [],
            highlightedProjects: cfg.highlightedProjects ?? [],
            showcaseRepos: cfg.showcaseRepos ?? [],
        });
        // Attempt to load editors; API will enforce owner check
        (async () => {
            try {
                const resp = await fetch(`/api/projects/editors?project_id=${encodeURIComponent(p.id)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    setEditors((data?.editors ?? []).map((e: { editor_address: string }) => ({ editor_address: e.editor_address })));
                } else {
                    setEditors([]);
                }
            } catch {
                setEditors([]);
            }
        })();
    }, []);

    // Auto-enter edit mode when arriving with ?edit=<slug|id>
    useEffect(() => {
        if (!router.isReady) return;
        const q = router.query?.edit;
        if (!q || editingId) return;
        const queryVal = Array.isArray(q) ? q[0] : q;
        if (!queryVal) return;
        const match = projects.find((p) => p.id === queryVal || p.slug === queryVal);
        if (match) onEdit(match);
    }, [router.isReady, router.query?.edit, projects, editingId, onEdit]);

    // Config form helpers
    const onChangeMainOrg = useCallback((field: keyof MainOrganization, value: unknown) => {
        setConfigForm((prev) => ({ ...prev, mainOrganization: { ...prev.mainOrganization, [field]: value } as MainOrganization }));
    }, []);

    const onChangeLogo = useCallback((which: 'logo' | 'logoWithName', field: keyof Logo, value: string) => {
        setConfigForm((prev) => ({
            ...prev,
            mainOrganization: {
                ...prev.mainOrganization,
                [which]: { ...prev.mainOrganization[which], [field]: field === 'width' || field === 'height' ? Number(value) || 0 : value } as Logo,
            },
        }));
    }, []);

    const addItem = useCallback(<T,>(list: T[], item: T) => [...list, item], []);
    const removeItem = useCallback(<T,>(list: T[], index: number) => list.filter((_, i) => i !== index), []);

    const addExtendedOrg = () => setConfigForm((p) => ({ ...p, extendedOrganizations: addItem(p.extendedOrganizations, { name: '', displayName: '', excludedRepos: [] }) }));
    const removeExtendedOrg = (i: number) => setConfigForm((p) => ({ ...p, extendedOrganizations: removeItem(p.extendedOrganizations, i) }));
    const updateExtendedOrg = (i: number, field: keyof ExtendedOrganization, value: string) => setConfigForm((p) => ({
        ...p,
        extendedOrganizations: p.extendedOrganizations.map((it, idx) => idx === i ? { ...it, [field]: field === 'excludedRepos' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value } : it),
    }));

    const updateRepositories = (field: keyof Repositories, value: string) => setConfigForm((p) => ({ ...p, repositories: { ...p.repositories, [field]: value } }));

    const updateDiscordStats = (field: keyof DiscordStats, value: string | boolean) => setConfigForm((p) => ({ ...p, discordStats: { ...p.discordStats, [field]: value } }));

    const addNpmPackage = () => setConfigForm((p) => ({ ...p, npmPackages: addItem(p.npmPackages, { key: '', name: '', github_package_id: '', dependents_url: '' }) }));
    const removeNpmPackage = (i: number) => setConfigForm((p) => ({ ...p, npmPackages: removeItem(p.npmPackages, i) }));
    const updateNpmPackage = (i: number, field: keyof NpmPackage, value: string) => setConfigForm((p) => ({
        ...p,
        npmPackages: p.npmPackages.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));

    const addSocial = () => setConfigForm((p) => ({ ...p, socialLinks: addItem(p.socialLinks, { name: '', url: '' }) }));
    const removeSocial = (i: number) => setConfigForm((p) => ({ ...p, socialLinks: removeItem(p.socialLinks, i) }));
    const updateSocial = (i: number, field: keyof SocialLink, value: string) => setConfigForm((p) => ({
        ...p,
        socialLinks: p.socialLinks.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));

    const addBuilder = () => setConfigForm((p) => ({ ...p, builderProjects: addItem(p.builderProjects, { id: '', icon: '', url: '' }) }));
    const removeBuilder = (i: number) => setConfigForm((p) => ({ ...p, builderProjects: removeItem(p.builderProjects, i) }));
    const updateBuilder = (i: number, field: keyof BuilderProject, value: string) => setConfigForm((p) => ({
        ...p,
        builderProjects: p.builderProjects.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));

    const addHighlighted = () => setConfigForm((p) => ({ ...p, highlightedProjects: addItem(p.highlightedProjects, { id: '', name: '', description: '', icon: '', url: '', category: '' }) }));
    const removeHighlighted = (i: number) => setConfigForm((p) => ({ ...p, highlightedProjects: removeItem(p.highlightedProjects, i) }));
    const updateHighlighted = (i: number, field: keyof HighlightedProject, value: string) => setConfigForm((p) => ({
        ...p,
        highlightedProjects: p.highlightedProjects.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));

    const addShowcase = () => setConfigForm((p) => ({ ...p, showcaseRepos: addItem(p.showcaseRepos, { id: '', name: '', description: '', icon: '', url: '', category: '' }) }));
    const removeShowcase = (i: number) => setConfigForm((p) => ({ ...p, showcaseRepos: removeItem(p.showcaseRepos, i) }));
    const updateShowcase = (i: number, field: keyof ShowcaseRepo, value: string) => setConfigForm((p) => ({
        ...p,
        showcaseRepos: p.showcaseRepos.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));

    const onDelete = useCallback(async (id: string) => {
        if (!confirm('Delete this project?')) return;
        setError(null);
        try {
            const resp = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data?.error || 'Delete failed');
            }
            await loadProjects();
            if (editingId === id) resetForm();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        }
    }, [editingId, loadProjects, resetForm]);

    const formTitle = useMemo(() => (editingId ? 'Edit Project' : 'Add Project'), [editingId]);
    const canSubmit = Boolean(sessionAddress);
    const canManageEditors = Boolean(editingId && sessionAddress);

    const addEditor = useCallback(async () => {
        if (!editingId || !newEditor.trim()) return;
        try {
            const resp = await fetch('/api/projects/editors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: editingId, editor_address: newEditor.trim() }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data?.error || 'Failed to add editor');
            setNewEditor('');
            setEditors((prev) => [...prev, { editor_address: data.editor.editor_address }]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add editor');
        }
    }, [editingId, newEditor]);

    const removeEditor = useCallback(async (addr: string) => {
        if (!editingId) return;
        try {
            const resp = await fetch(`/api/projects/editors?project_id=${encodeURIComponent(editingId)}&editor_address=${encodeURIComponent(addr)}`, { method: 'DELETE' });
            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to remove editor');
            }
            setEditors((prev) => prev.filter((e) => e.editor_address !== addr));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to remove editor');
        }
    }, [editingId]);

    const transferOwner = useCallback(async () => {
        if (!editingId || !newOwner.trim()) return;
        try {
            const resp = await fetch('/api/projects/owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: editingId, new_owner_address: newOwner.trim() }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data?.error || 'Failed to transfer owner');
            setNewOwner('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to transfer owner');
        }
    }, [editingId, newOwner]);

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Manage Cardano Projects | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Manage Cardano Projects</h1>
                <div className={pageStyles.section}>
                    <form className={styles.form} onSubmit={onSubmit}>
                        <h2 className={styles.formTitle}>{formTitle}</h2>
                        {error && <div className={styles.error}>{error}</div>}
                        {!sessionAddress && (
                            <div className={styles.muted}>Connect and verify a wallet to create or edit projects.</div>
                        )}
                        <div className={styles.grid}>
                            {/* Slug is auto-generated from Name */}
                            <label className={styles.field}>
                                <span>Name</span>
                                <input name="name" value={form.name} onChange={onChange} placeholder="Project Name" required />
                            </label>
                            <label className={styles.field}>
                                <span>URL</span>
                                <input name="url" value={form.url} onChange={onChange} placeholder="https://example.com" required />
                            </label>
                            <label className={styles.field}>
                                <span>Category</span>
                                <input name="category" value={form.category} onChange={onChange} placeholder="Development Tool" />
                            </label>
                            <label className={styles.checkbox}>
                                <input type="checkbox" name="is_active" checked={form.is_active} onChange={onChange} />
                                <span>Active</span>
                            </label>
                            <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Description</span>
                                <textarea name="description" value={form.description} onChange={onChange} rows={3} placeholder="Short description" />
                            </label>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Main Organization</span>
                                <div className={styles.grid}>
                                    <label className={styles.field}><span>Name</span><input value={configForm.mainOrganization.name} onChange={(e) => onChangeMainOrg('name', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo Src</span><input value={configForm.mainOrganization.logo.src} onChange={(e) => onChangeLogo('logo', 'src', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo Width</span><input type="number" value={configForm.mainOrganization.logo.width} onChange={(e) => onChangeLogo('logo', 'width', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo Height</span><input type="number" value={configForm.mainOrganization.logo.height} onChange={(e) => onChangeLogo('logo', 'height', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo+Name Src</span><input value={configForm.mainOrganization.logoWithName.src} onChange={(e) => onChangeLogo('logoWithName', 'src', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo+Name Width</span><input type="number" value={configForm.mainOrganization.logoWithName.width} onChange={(e) => onChangeLogo('logoWithName', 'width', e.target.value)} /></label>
                                    <label className={styles.field}><span>Logo+Name Height</span><input type="number" value={configForm.mainOrganization.logoWithName.height} onChange={(e) => onChangeLogo('logoWithName', 'height', e.target.value)} /></label>
                                    <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span>Excluded Repos (comma-separated)</span><input value={configForm.mainOrganization.excludedRepos.join(', ')} onChange={(e) => onChangeMainOrg('excludedRepos', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
                                </div>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Extended Organizations</span>
                                {configForm.extendedOrganizations.map((org, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Name</span><input value={org.name} onChange={(e) => updateExtendedOrg(i, 'name', e.target.value)} /></label>
                                        <label className={styles.field}><span>Display Name</span><input value={org.displayName} onChange={(e) => updateExtendedOrg(i, 'displayName', e.target.value)} /></label>
                                        <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span>Excluded Repos (comma-separated)</span><input value={org.excludedRepos.join(', ')} onChange={(e) => updateExtendedOrg(i, 'excludedRepos', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeExtendedOrg(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addExtendedOrg}>Add Organization</button></div>
                            </div>
                            <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.field}><span>Repositories – Governance</span><input value={configForm.repositories.governance} onChange={(e) => updateRepositories('governance', e.target.value)} /></label>
                                <label className={styles.field}><span>Repositories – Dependents Count Repo</span><input value={configForm.repositories.dependentsCountRepo} onChange={(e) => updateRepositories('dependentsCountRepo', e.target.value)} /></label>
                            </div>
                            <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.field}><span>Pool ID</span><input value={configForm.poolId} onChange={(e) => setConfigForm((p) => ({ ...p, poolId: e.target.value }))} /></label>
                                <label className={styles.field}><span>DRep ID</span><input value={configForm.drepId} onChange={(e) => setConfigForm((p) => ({ ...p, drepId: e.target.value }))} /></label>
                                <label className={styles.field}><span>Catalyst Project IDs (comma-separated)</span><input value={configForm.catalystProjectIds} onChange={(e) => setConfigForm((p) => ({ ...p, catalystProjectIds: e.target.value }))} /></label>
                                <label className={styles.field}><span>Discord Guild ID</span><input value={configForm.discordGuildId} onChange={(e) => setConfigForm((p) => ({ ...p, discordGuildId: e.target.value }))} /></label>
                            </div>
                            <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.checkbox}><input type="checkbox" checked={configForm.discordStats.useApiAction} onChange={(e) => updateDiscordStats('useApiAction', e.target.checked)} /><span>Discord useApiAction</span></label>
                                <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span>Discord Description</span><input value={configForm.discordStats.description} onChange={(e) => updateDiscordStats('description', e.target.value)} /></label>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>NPM Packages</span>
                                {configForm.npmPackages.map((pkg, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Name</span><input value={pkg.name} onChange={(e) => updateNpmPackage(i, 'name', e.target.value)} /></label>
                                        <label className={styles.field}><span>GitHub Package ID</span><input value={pkg.github_package_id ?? ''} onChange={(e) => updateNpmPackage(i, 'github_package_id', e.target.value)} /></label>
                                        <label className={styles.field}><span>Dependents URL</span><input value={pkg.dependents_url ?? ''} onChange={(e) => updateNpmPackage(i, 'dependents_url', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeNpmPackage(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addNpmPackage}>Add Package</button></div>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Social Links</span>
                                {configForm.socialLinks.map((s, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Name</span><input value={s.name} onChange={(e) => updateSocial(i, 'name', e.target.value)} /></label>
                                        <label className={styles.field}><span>URL</span><input value={s.url} onChange={(e) => updateSocial(i, 'url', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeSocial(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addSocial}>Add Social Link</button></div>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Builder Projects</span>
                                {configForm.builderProjects.map((b, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Icon</span><input value={b.icon} onChange={(e) => updateBuilder(i, 'icon', e.target.value)} /></label>
                                        <label className={styles.field}><span>URL</span><input value={b.url} onChange={(e) => updateBuilder(i, 'url', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeBuilder(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addBuilder}>Add Builder Project</button></div>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Highlighted Projects</span>
                                {configForm.highlightedProjects.map((h, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Name</span><input value={h.name} onChange={(e) => updateHighlighted(i, 'name', e.target.value)} /></label>
                                        <label className={styles.field}><span>Description</span><input value={h.description} onChange={(e) => updateHighlighted(i, 'description', e.target.value)} /></label>
                                        <label className={styles.field}><span>Icon</span><input value={h.icon} onChange={(e) => updateHighlighted(i, 'icon', e.target.value)} /></label>
                                        <label className={styles.field}><span>URL</span><input value={h.url} onChange={(e) => updateHighlighted(i, 'url', e.target.value)} /></label>
                                        <label className={styles.field}><span>Category</span><input value={h.category ?? ''} onChange={(e) => updateHighlighted(i, 'category', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeHighlighted(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addHighlighted}>Add Highlighted Project</button></div>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <span>Showcase Repos</span>
                                {configForm.showcaseRepos.map((r, i) => (
                                    <div key={i} className={styles.grid}>
                                        <label className={styles.field}><span>Name</span><input value={r.name} onChange={(e) => updateShowcase(i, 'name', e.target.value)} /></label>
                                        <label className={styles.field}><span>Description</span><input value={r.description} onChange={(e) => updateShowcase(i, 'description', e.target.value)} /></label>
                                        <label className={styles.field}><span>Icon</span><input value={r.icon} onChange={(e) => updateShowcase(i, 'icon', e.target.value)} /></label>
                                        <label className={styles.field}><span>URL</span><input value={r.url} onChange={(e) => updateShowcase(i, 'url', e.target.value)} /></label>
                                        <label className={styles.field}><span>Category</span><input value={r.category} onChange={(e) => updateShowcase(i, 'category', e.target.value)} /></label>
                                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeShowcase(i)}>Remove</button></div>
                                    </div>
                                ))}
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addShowcase}>Add Showcase Repo</button></div>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button type="submit" className={styles.primary} disabled={isLoading || !canSubmit}>{editingId ? 'Update' : 'Create'}</button>
                            {editingId && (
                                <button type="button" className={styles.secondary} onClick={resetForm}>Cancel</button>
                            )}
                        </div>
                    </form>
                </div>

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
                                        <th>Category</th>
                                        <th>Active</th>
                                        <th>URL</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.name}</td>
                                            <td>{p.slug}</td>
                                            <td>{p.category ?? ''}</td>
                                            <td>{p.is_active ? 'Yes' : 'No'}</td>
                                            <td>
                                                <a href={`/projects/${encodeURIComponent(p.slug)}`}>link</a>
                                            </td>
                                            <td>
                                                <button className={styles.linkBtn} onClick={() => onEdit(p)}>Edit</button>
                                                <button className={styles.linkBtnDanger} onClick={() => onDelete(p.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {projects.length === 0 && <p className={styles.muted}>No projects yet.</p>}
                        </div>
                    )}
                </div>

                {editingId && (
                    <div className={pageStyles.section}>
                        <h2 className={styles.sectionTitle}>Editors</h2>
                        {!canManageEditors ? (
                            <p className={styles.muted}>Only the project owner can manage editors.</p>
                        ) : (
                            <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                    <span>Add editor wallet address</span>
                                    <input value={newEditor} onChange={(e) => setNewEditor(e.target.value)} placeholder="addr... or stake..." />
                                    <div className={styles.actions}>
                                        <button type="button" className={styles.secondary} onClick={addEditor}>Add Editor</button>
                                    </div>
                                </div>
                                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                    <span>Current editors</span>
                                    {editors.length === 0 ? (
                                        <div className={styles.muted}>None</div>
                                    ) : (
                                        <ul>
                                            {editors.map((e) => (
                                                <li key={e.editor_address}>
                                                    {e.editor_address}
                                                    <button className={styles.linkBtnDanger} onClick={() => removeEditor(e.editor_address)}>Remove</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                    <span>Transfer ownership to wallet</span>
                                    <input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="addr... or stake..." />
                                    <div className={styles.actions}>
                                        <button type="button" className={styles.secondary} onClick={transferOwner}>Transfer Owner</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}


