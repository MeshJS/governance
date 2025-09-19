import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import { getClientCsrfToken } from '@/utils/csrf';
import type {
    ProjectInput,
    ProjectRecord,
    OrgStatsConfig,
    Logo,
    MainOrganization,
    ExtendedOrganization,
    NpmPackage,
    SocialLink,
    BuilderProject,
    HighlightedProject,
    ShowcaseRepo,
} from '@/types/projects';

export type ProjectEditorModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
    onSaved: () => void;
};

export function ProjectEditorModal({ isOpen, project, canSubmit, onClose, onSaved }: ProjectEditorModalProps) {
    const [error, setError] = useState<string | null>(null);
    // Editors/ownership moved to EditorsModal

    const defaultConfig: OrgStatsConfig = useMemo(() => ({
        mainOrganization: {
            name: '',
            displayName: '',
            logo: { src: '', width: 40, height: 40 },
            logoWithName: { src: '', width: 120, height: 120 },
            excludedRepos: [],
        },
        extendedOrganizations: [],
        poolId: '',
        drepId: '',
        discordGuildId: '',
        catalystProjectIds: '',
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

    // Prefill when opening for edit
    useEffect(() => {
        if (!project) {
            setForm({ slug: '', name: '', description: '', url: '', icon_url: '', category: '', is_active: true });
            setConfigForm(defaultConfig);
            // no-op
            setError(null);
            return;
        }
        setForm({
            slug: project.slug,
            name: project.name,
            description: project.description ?? '',
            url: project.url,
            icon_url: project.icon_url ?? '',
            category: project.category ?? '',
            is_active: project.is_active,
        });
        const cfg = (project.config ?? {}) as Partial<OrgStatsConfig>;
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
            poolId: cfg.poolId ?? '',
            drepId: cfg.drepId ?? '',
            discordGuildId: cfg.discordGuildId ?? '',
            catalystProjectIds: cfg.catalystProjectIds ?? '',
            npmPackages: cfg.npmPackages ?? [],
            socialLinks: cfg.socialLinks ?? [],
            builderProjects: cfg.builderProjects ?? [],
            highlightedProjects: cfg.highlightedProjects ?? [],
            showcaseRepos: cfg.showcaseRepos ?? [],
        });
        // editors fetched in EditorsModal
    }, [project, defaultConfig]);

    // Keep displayName in sync with project name
    useEffect(() => {
        setConfigForm((prev) => {
            if (prev.mainOrganization.displayName === form.name) return prev;
            return {
                ...prev,
                mainOrganization: { ...prev.mainOrganization, displayName: form.name },
            };
        });
    }, [form.name]);

    // Keep icon_url in sync with mainOrganization.logo.src
    useEffect(() => {
        const logoSrc = configForm.mainOrganization.logo.src;
        setForm((prev) => (prev.icon_url === logoSrc ? prev : { ...prev, icon_url: logoSrc }));
    }, [configForm.mainOrganization.logo.src]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);

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

    const addNpmPackage = () => setConfigForm((p) => ({ ...p, npmPackages: addItem(p.npmPackages, { key: '', name: '', github_package_id: '', dependents_url: '' }) }));
    const removeNpmPackage = (i: number) => setConfigForm((p) => ({ ...p, npmPackages: removeItem(p.npmPackages, i) }));
    const updateNpmPackage = (i: number, field: keyof NpmPackage, value: string) => setConfigForm((p) => ({
        ...p,
        npmPackages: p.npmPackages.map((it, idx) => {
            if (idx === i) {
                if (field === 'dependents_url' && value && !value.endsWith('/network/dependents')) {
                    return { ...it, [field]: value.endsWith('/') ? `${value}network/dependents` : `${value}/network/dependents` };
                }
                return { ...it, [field]: value };
            }
            return it;
        }),
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

    const onSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const deriveSlug = (projectName: string): string => (projectName || '').toLowerCase().trim().replace(/\s+/g, '-');
            const derivePackageKey = (pkgName: string): string => {
                if (!pkgName) return '';
                const afterSlash = pkgName.includes('/') ? pkgName.split('/').pop() ?? '' : pkgName;
                return afterSlash.trim();
            };
            const configToSave: OrgStatsConfig = {
                ...configForm,
                npmPackages: configForm.npmPackages.map((pkg) => ({ ...pkg, key: derivePackageKey(pkg.name) })),
                builderProjects: configForm.builderProjects.map((b, i) => ({ ...b, id: `b${i + 1}` })),
                highlightedProjects: configForm.highlightedProjects.map((h) => ({ ...h, id: h.name })),
                showcaseRepos: configForm.showcaseRepos.map((r, i) => ({ ...r, id: String(i + 1) })),
            };
            const isEditing = Boolean(project?.id);
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing
                ? { id: project?.id, ...form, slug: deriveSlug(form.name), config: configToSave }
                : { ...form, slug: deriveSlug(form.name), config: configToSave };
            const csrf = getClientCsrfToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrf) headers['X-CSRF-Token'] = csrf;
            const resp = await fetch('/api/projects', {
                method,
                headers,
                body: JSON.stringify(body),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Save failed');
            onSaved();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        }
    }, [project?.id, form, configForm, onSaved, onClose]);

    // removed editors helpers

    const formTitle = useMemo(() => (project?.id ? 'Edit Project' : 'Add Project'), [project?.id]);
    // removed editors flag

    return (
        <Modal isOpen={isOpen} title={formTitle} onClose={onClose}>
            {error && <div className={styles.error}>{error}</div>}
            {!canSubmit && (
                <div className={styles.muted}>Connect and verify a wallet to create or edit projects.</div>
            )}
            <form className={styles.form} onSubmit={onSubmit}>
                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Name</span>
                        <input name="name" value={form.name} onChange={onChange} placeholder="Project Name" required />
                    </label>
                    <label className={styles.field}>
                        <span>Wesite URL</span>
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
                        <span>Main Github Organization</span>
                        <div className={styles.grid}>
                            <label className={styles.field}><span>Name</span><input value={configForm.mainOrganization.name} onChange={(e) => onChangeMainOrg('name', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo Src</span><input value={configForm.mainOrganization.logo.src} onChange={(e) => onChangeLogo('logo', 'src', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo Width</span><input type="number" value={configForm.mainOrganization.logo.width} onChange={(e) => onChangeLogo('logo', 'width', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo Height</span><input type="number" value={configForm.mainOrganization.logo.height} onChange={(e) => onChangeLogo('logo', 'height', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo+Name Src</span><input value={configForm.mainOrganization.logoWithName.src} onChange={(e) => onChangeLogo('logoWithName', 'src', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo+Name Width</span><input type="number" value={configForm.mainOrganization.logoWithName.width} onChange={(e) => onChangeLogo('logoWithName', 'width', e.target.value)} /></label>
                            <label className={styles.field}><span>Logo+Name Height</span><input type="number" value={configForm.mainOrganization.logoWithName.height} onChange={(e) => onChangeLogo('logoWithName', 'height', e.target.value)} /></label>
                            <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span>Excluded GitHub Repos (comma-separated)</span><input value={configForm.mainOrganization.excludedRepos.join(', ')} onChange={(e) => onChangeMainOrg('excludedRepos', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Extended GitHub Organizations</span>
                        {configForm.extendedOrganizations.map((org, i) => (
                            <div key={i} className={styles.grid}>
                                <label className={styles.field}><span>Name</span><input value={org.name} onChange={(e) => updateExtendedOrg(i, 'name', e.target.value)} /></label>
                                <label className={styles.field}><span>Display Name</span><input value={org.displayName} onChange={(e) => updateExtendedOrg(i, 'displayName', e.target.value)} /></label>
                                <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span>Excluded GitHub Repos (comma-separated)</span><input value={org.excludedRepos.join(', ')} onChange={(e) => updateExtendedOrg(i, 'excludedRepos', e.target.value)} /></label>
                                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => removeExtendedOrg(i)}>Remove</button></div>
                            </div>
                        ))}
                        <div className={styles.actions}><button type="button" className={styles.secondary} onClick={addExtendedOrg}>Add Organization</button></div>
                    </div>
                    <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                        <label className={styles.field}><span>Pool ID</span><input value={configForm.poolId} onChange={(e) => setConfigForm((p) => ({ ...p, poolId: e.target.value }))} /></label>
                        <label className={styles.field}><span>DRep ID</span><input value={configForm.drepId} onChange={(e) => setConfigForm((p) => ({ ...p, drepId: e.target.value }))} /></label>
                        <label className={styles.field}><span>Discord Guild ID</span><input value={configForm.discordGuildId} onChange={(e) => setConfigForm((p) => ({ ...p, discordGuildId: e.target.value }))} /></label>
                        <label className={styles.field}><span>Catalyst Project IDs (comma-separated)</span><input value={configForm.catalystProjectIds} onChange={(e) => setConfigForm((p) => ({ ...p, catalystProjectIds: e.target.value }))} /></label>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>NPM Packages</span>
                        {configForm.npmPackages.map((pkg, i) => (
                            <div key={i} className={styles.grid}>
                                <label className={styles.field}><span>Name (eg. @meshsdk/core)</span><input value={pkg.name} onChange={(e) => updateNpmPackage(i, 'name', e.target.value)} /></label>
                                <label className={styles.field}><span>GitHub Package ID</span><input value={pkg.github_package_id ?? ''} onChange={(e) => updateNpmPackage(i, 'github_package_id', e.target.value)} /></label>
                                <label className={styles.field}><span>Dependents URL (url of repo where package lives)</span><input value={pkg.dependents_url ?? ''} onChange={(e) => updateNpmPackage(i, 'dependents_url', e.target.value)} /></label>
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
                    <button type="submit" className={styles.primary} disabled={!canSubmit}>{project?.id ? 'Update' : 'Create'}</button>
                    <button type="button" className={styles.secondary} onClick={onClose}>Cancel</button>
                </div>
            </form>
            {/* Editors moved to EditorsModal */}
        </Modal>
    );
}


