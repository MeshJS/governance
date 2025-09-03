import Head from "next/head";
import Link from "next/link";
import { useMemo, useEffect } from "react";
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './index.module.css';
import { ProjectsProvider, useProjectsContext } from '@/contexts/ProjectsContext';

type LogoConfig = { src?: string; width?: number; height?: number };
type MainOrgConfig = { logo?: LogoConfig; logoWithName?: LogoConfig; displayName?: string };
type ConfigShape = { mainOrganization?: MainOrgConfig };

const getLogoUrl = (config: unknown, fallback: string | null): string | undefined => {
    const cfg = (config ?? {}) as ConfigShape;
    const logo = cfg.mainOrganization?.logo?.src || cfg.mainOrganization?.logoWithName?.src;
    return (logo && typeof logo === 'string' && logo.length > 0) ? logo : (fallback ?? undefined);
};

function ProjectsIndexContent() {
    const { projects, contributorActivity, loading, isError, error } = useProjectsContext();

    const visibleProjects = useMemo(() => projects, [projects]);

    // Log contributor data when it's available
    useEffect(() => {
        if (contributorActivity.length > 0) {
            console.log('All Projects Contributor Activity Data:', contributorActivity);

            // Log summary statistics
            const totalContributors = contributorActivity.reduce(
                (sum, project) => sum + project.contributor_activity.length, 0
            );
            console.log(`Total projects with contributor data: ${contributorActivity.length}`);
            console.log(`Total contributors across all projects: ${totalContributors}`);

            // Log each project's contributor summary
            contributorActivity.forEach(project => {
                const totalCommits = project.contributor_activity.reduce(
                    (sum, contributor) => sum + contributor.commit_count, 0
                );
                const totalPRs = project.contributor_activity.reduce(
                    (sum, contributor) => sum + contributor.pr_count, 0
                );
                console.log(`Project "${project.project_name}" (${project.org_name}):`, {
                    contributors: project.contributor_activity.length,
                    totalCommits,
                    totalPRs
                });
            });
        }
    }, [contributorActivity]);

    // Log loading and error states
    useEffect(() => {
        if (loading.contributorActivity) {
            console.log('Loading contributor activity data...');
        }
        if (isError.contributorActivity) {
            console.error('Error loading contributor activity:', error.contributorActivity);
        }
    }, [loading.contributorActivity, isError.contributorActivity, error.contributorActivity]);

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Projects | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Projects</h1>
                <div className={pageStyles.section}>
                    {loading.projects && <p>Loading…</p>}
                    {isError.projects && <p style={{ color: 'var(--danger)' }}>{error.projects?.message || 'Failed to load projects'}</p>}
                    {!loading.projects && !isError.projects && (
                        <ul className={styles.grid}>
                            {visibleProjects.map((p) => {
                                const logoUrl = getLogoUrl(p.config, p.icon_url);
                                return (
                                    <li key={p.id} className={styles.card}>
                                        <Link href={`/projects/${encodeURIComponent(p.slug)}`} className={styles.cardLink}>
                                            <div className={styles.logoWrap}>
                                                {logoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={logoUrl} alt={p.name} className={styles.logo} />
                                                ) : (
                                                    <div className={styles.logoPlaceholder} />
                                                )}
                                            </div>
                                            <div className={styles.content}>
                                                <h3 className={styles.title}>{p.name}</h3>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {!loading.projects && !isError.projects && visibleProjects.length === 0 && (
                        <p className={styles.muted}>No projects found.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ProjectsIndex() {
    return (
        <ProjectsProvider fetchOptions={{ fetchProjects: true, fetchContributorActivity: false }}>
            <ProjectsIndexContent />
        </ProjectsProvider>
    );
}


