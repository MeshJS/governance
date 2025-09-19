import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './index.module.css';
import { ProjectsProvider, useProjectsContext } from '@/contexts/ProjectsContext';
import type { ProjectRecord } from 'types/projects';
import { useWallet } from '@/contexts/WalletContext';

type ProjectRecordWithRole = ProjectRecord & { my_role?: 'owner' | 'admin' | 'editor' | null; can_edit?: boolean | null };

function ProjectDetail({ project }: { project: ProjectRecordWithRole }) {
    const { contributorActivity, loading, isError, error } = useProjectsContext();
    const { sessionAddress } = useWallet();

    // Log contributor data when it's available
    useEffect(() => {
        if (contributorActivity.length > 0) {
            console.log('Contributor Activity Data:', contributorActivity);
        } else {
            console.log('No contributor activity data available');
        }
    }, [contributorActivity, project]);

    // Log loading and error states
    useEffect(() => {
        if (loading.contributorActivity) {
            console.log('Loading contributor activity data...');
        }
        if (isError.contributorActivity) {
            console.error('Error loading contributor activity:', error.contributorActivity);
        }
    }, [loading.contributorActivity, isError.contributorActivity, error.contributorActivity]);

    const websiteUrl = project.url && /^(https?:)?\/\//i.test(project.url)
        ? project.url
        : `https://${String(project.url).replace(/^\/+/, '')}`;

    const subpages = [
        { key: 'drep', title: 'DRep', description: 'Delegated representatives overview' },
        { key: 'catalyst-proposals', title: 'Catalyst Proposals', description: 'Funded proposals and status' },
        { key: 'stats', title: 'Stats', description: 'Usage and other metrics' },
        { key: 'projects', title: 'Projects', description: 'Related projects and repositories' },
        { key: 'contributors', title: 'Contributors', description: 'People and organizations involved' },
    ] as const;

    const [editableInfo, setEditableInfo] = useState<{ isEditable: boolean; myRole: 'owner' | 'admin' | 'editor' | null }>({ isEditable: false, myRole: null });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!sessionAddress || !project?.id) {
                if (!cancelled) setEditableInfo({ isEditable: false, myRole: null });
                return;
            }
            try {
                const resp = await fetch('/api/projects?only_editable=true&include_inactive=true', { credentials: 'same-origin' });
                const data = await resp.json().catch(() => ({}));
                const found = Array.isArray(data?.projects) ? data.projects.find((p: { id?: string }) => p?.id === project.id) : undefined;
                if (!cancelled) setEditableInfo({ isEditable: Boolean(found), myRole: (found?.my_role ?? null) as 'owner' | 'admin' | 'editor' | null });
            } catch {
                if (!cancelled) setEditableInfo({ isEditable: false, myRole: null });
            }
        })();
        return () => { cancelled = true; };
    }, [sessionAddress, project?.id]);

    const canEdit = Boolean(
        (project?.can_edit ?? false)
        || (project?.my_role === 'owner' || project?.my_role === 'admin' || project?.my_role === 'editor')
        || editableInfo.isEditable
    );

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>{project.name} | Cardano Dashboard</title>
            </Head>
            <main>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h1 className={pageStyles.pageTitle} style={{ marginBottom: 0 }}>{project.name}</h1>
                    {sessionAddress && canEdit && (
                        <Link href={`/projects/manage?edit=${encodeURIComponent(project.slug)}`} className={styles.editBtn}>
                            Edit project
                        </Link>
                    )}
                </div>
                <p>{project.description || 'No description available.'}</p>
                <p>
                    <strong>Category:</strong> {project.category || 'N/A'}
                </p>
                <p>
                    <a href={websiteUrl} target="_blank" rel="noreferrer noopener">Visit website</a>
                </p>

                <section className={pageStyles.section}>
                    <h2 className={pageStyles.sectionTitle}>Explore</h2>
                    <ul className={styles.grid}>
                        {subpages.map((s) => (
                            <li key={s.key} className={styles.card}>
                                <Link
                                    href={`/projects/${encodeURIComponent(project.slug)}/${s.key}`}
                                    className={styles.cardLink}
                                >
                                    <div className={styles.content}>
                                        <h3 className={styles.title}>{s.title}</h3>
                                        <p className={styles.description}>{s.description}</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}

function ProjectBySlugIndexContent() {
    const router = useRouter();
    const slug = String(router.query?.slug || '');
    const { projects, loading } = useProjectsContext();

    const project: ProjectRecordWithRole | undefined = useMemo(
        () => projects.find((p) => p.slug === slug),
        [projects, slug]
    );

    if (loading.projects) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>Loading… | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>Loading…</h1>
                </main>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>Project not found | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>Project not found</h1>
                    <p>We could not find that project. It might have been removed or is inactive.</p>
                </main>
            </div>
        );
    }

    // Once we have the project, create a nested provider to fetch contributor activity
    return (
        <ProjectsProvider fetchOptions={{
            fetchProjects: false,
            fetchContributorActivity: true,
            specificProject: project,
        }}>
            <ProjectDetail project={project} />
        </ProjectsProvider>
    );
}

export default function ProjectBySlugIndex() {
    return (
        <ProjectsProvider fetchOptions={{
            fetchProjects: true,
            fetchContributorActivity: false,
        }}>
            <ProjectBySlugIndexContent />
        </ProjectsProvider>
    );
}


