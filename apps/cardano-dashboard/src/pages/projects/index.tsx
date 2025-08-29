import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './index.module.css';

type ProjectRecord = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    url: string;
    icon_url: string | null;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    config?: unknown;
};

type ApiResponse = { projects: ProjectRecord[] } | { error: string };

type LogoConfig = { src?: string; width?: number; height?: number };
type MainOrgConfig = { logo?: LogoConfig; logoWithName?: LogoConfig; displayName?: string };
type ConfigShape = { mainOrganization?: MainOrgConfig };

const getLogoUrl = (config: unknown, fallback: string | null): string | undefined => {
    const cfg = (config ?? {}) as ConfigShape;
    const logo = cfg.mainOrganization?.logo?.src || cfg.mainOrganization?.logoWithName?.src;
    return (logo && typeof logo === 'string' && logo.length > 0) ? logo : (fallback ?? undefined);
};

export default function ProjectsIndex() {
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setHasError(null);
            try {
                const resp = await fetch('/api/projects');
                const data = (await resp.json()) as ApiResponse;
                if (!resp.ok || 'error' in data) throw new Error(('error' in data) ? data.error : 'Failed to load projects');
                if (!cancelled) setProjects(data.projects ?? []);
            } catch (e) {
                if (!cancelled) setHasError(e instanceof Error ? e.message : 'Failed to load projects');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const visibleProjects = useMemo(() => projects, [projects]);

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Projects | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Projects</h1>
                <div className={pageStyles.section}>
                    {isLoading && <p>Loading…</p>}
                    {hasError && <p style={{ color: 'var(--danger)' }}>{hasError}</p>}
                    {!isLoading && !hasError && (
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
                    {!isLoading && !hasError && visibleProjects.length === 0 && (
                        <p className={styles.muted}>No projects found.</p>
                    )}
                </div>
            </main>
        </div>
    );
}


