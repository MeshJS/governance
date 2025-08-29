import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from 'next';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from './index.module.css';
import { getSupabaseServerClient } from '@/utils/supabaseServer';

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

type Props = {
    project: ProjectRecord | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const slug = String(ctx.params?.slug || '');
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from('cardano_projects')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        return { props: { project: null } };
    }

    return { props: { project: data as ProjectRecord } };
};

export default function ProjectBySlugIndex({ project }: Props) {
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


