import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './index.module.css';
import { ProjectsProvider, useProjectsContext } from '@/contexts/ProjectsContext';
import type { ProjectRecord } from 'types/projects';

function ProjectDetail({ project }: { project: ProjectRecord }) {
    const { contributorActivity, loading, isError, error } = useProjectsContext();

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

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>{project.name} | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>{project.name}</h1>
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

    const project: ProjectRecord | undefined = useMemo(
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


