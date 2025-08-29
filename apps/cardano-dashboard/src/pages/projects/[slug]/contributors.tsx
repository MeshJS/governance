import Head from "next/head";
import type { GetServerSideProps } from 'next';
import Link from "next/link";
import pageStyles from '@/styles/PageLayout.module.css';
import { getSupabaseServerClient } from '@/utils/supabaseServer';

type ProjectRecord = { id: string; slug: string; name: string };

type Props = { project: ProjectRecord | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
    const slug = String(ctx.params?.slug || '');
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
        .from('cardano_projects')
        .select('id, slug, name')
        .eq('slug', slug)
        .single();
    return { props: { project: (data as ProjectRecord) ?? null } };
};

export default function ContributorsPage({ project }: Props) {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>{project ? `${project.name} — Contributors` : 'Contributors'} | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Contributors</h1>
                <p>Draft view for contributors and organizations participating in this project.</p>
                <p>
                    <Link href={`/projects/${encodeURIComponent(project?.slug ?? '')}`}>Back to project</Link>
                </p>
            </main>
        </div>
    );
}


