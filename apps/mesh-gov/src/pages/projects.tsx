import { useData } from '../contexts/DataContext';
import styles from '../styles/Projects.module.css';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';
import Image from 'next/image';
import { FaGithub } from 'react-icons/fa';
import { TbWorld, TbBook } from 'react-icons/tb';

interface ProjectLinks {
    github?: string;
    web?: string;
    docs?: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    icon: string;
    previewImage: string;
    links: ProjectLinks;
    category?: string;
}

const projects: Project[] = [
    {
        id: '1',
        name: 'Mesh Core',
        description: 'Collection of comprehensive TypeScript libraries for blockchain development on Cardano.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-sdk.png',
        links: {
            github: 'https://github.com/MeshJS/mesh',
            web: 'https://meshjs.dev/',
            docs: 'https://docs.meshjs.dev/'
        },
        category: 'Development Tool'
    },
    {
        id: '4',
        name: 'UTXOS',
        description: 'Streamline user onboarding and Web3 integration, accelerating your app\'s time to market.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-utxos.png',
        links: {
            github: 'https://github.com/MeshJS/web3-sdk',
            web: 'https://utxos.dev/',
            docs: 'https://docs.utxos.dev/'
        },
        category: 'Development Tool'
    },
    {
        id: '3',
        name: 'Multisig Platform',
        description: 'Secure your treasury and participate in Cardano governance as a team with multi-signature.',
        icon: '/wallet.png',
        previewImage: '/pr-multisig.png',
        links: {
            github: 'https://github.com/MeshJS/multisig',
            web: 'https://multisig.meshjs.dev/'
        },
        category: 'Development Tool'
    },
    {
        id: '2',
        name: 'Midnight',
        description: 'Mesh Midnight providers tools and resources for developers to build on Midnight.',
        icon: '/Midnight-RGB_Symbol-White.png',
        previewImage: '/pr-midnight.png',
        links: {
            github: 'https://github.com/MeshJS/midnight'
        },
        category: 'Development Tool'
    },
    {
        id: '5',
        name: 'Mimir',
        description: 'AI compatible web3 tools for enhanced blockchain development and smart contract interactions.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-mimir.png',
        links: {
            github: 'https://github.com/MeshJS/mimir'
        },
        category: 'Development Tool'
    },
    {
        id: '7',
        name: 'Cquisitor',
        description: 'An open source CBOR investigation tool for analyzing and debugging Cardano blockchain transactions.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-cquisitor.png',
        links: {
            github: 'https://github.com/MeshJS/cquisitor-lib',
            web: 'https://cloud.meshjs.dev/cquisitor'
        },
        category: 'Development Tool'
    },
    {
        id: '8',
        name: 'Hydra',
        description: 'Build and deploy Hydra Head protocols on Cardano with ease using our comprehensive toolkit.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-hydra.png',
        links: {
            github: 'https://github.com/MeshJS/mesh/tree/main/apps/playground/src/pages/hydra',
            web: 'https://meshjs.dev/hydra',
            docs: 'https://meshjs.dev/hydra/tutorial'
        },
        category: 'Development Tool'
    },
    {
        id: '9',
        name: 'Governance Dashboard',
        description: 'Track and analyze Mesh\'s participation in the Cardano ecosystem governance.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-dashboard.png',
        links: {
            github: 'https://github.com/MeshJS/governance/tree/main/apps/mesh-gov',
            web: 'https://gov.meshjs.dev/'
        },
        category: 'Governance'
    },
    {
        id: '10',
        name: 'Project Based Learning',
        description: 'Learn blockchain development through hands-on projects and practical exercises.',
        icon: '/logo-mesh-white-512x512.png',
        previewImage: '/pr-pbl.png',
        links: {
            github: 'https://github.com/MeshJS/mesh-pbl',
            web: 'https://app.andamio.io/course/510de33d6a31bce2e12d946f21ba616af3547a25c674edad8a7af6ba'
        },
        category: 'Education'
    }
];

const ProjectCard = ({ project }: { project: Project }) => {
    return (
        <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
                <div className={styles.projectIcon}>
                    <Image
                        src={project.icon}
                        alt={`${project.name} icon`}
                        width={40}
                        height={40}
                    />
                </div>
                <h3 className={styles.projectName}>{project.name}</h3>
            </div>
            <div className={styles.projectPreview}>
                <Image
                    src={project.previewImage}
                    alt={`${project.name} preview`}
                    width={400}
                    height={400}
                    className={styles.previewImage}
                    priority
                />
            </div>
            <div className={styles.projectLinks}>
                {project.links.github && (
                    <Link
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                        title="GitHub"
                    >
                        <FaGithub size={24} />
                    </Link>
                )}
                {project.links.web && (
                    <Link
                        href={project.links.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                        title="Website"
                    >
                        <TbWorld size={24} />
                    </Link>
                )}
                {project.links.docs && (
                    <Link
                        href={project.links.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                        title="Documentation"
                    >
                        <TbBook size={24} />
                    </Link>
                )}
            </div>
        </div>
    );
};

export default function Projects() {
    const { meshData, isLoading, error } = useData();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title={<>Mesh <span>Projects</span></>}
                subtitle="Mesh is busy building tools to enhance and grow the Cardano Ecosystem, here a few of our most active and promising projects"
            />

            <div className={styles.projectsGrid} id="projectsGrid">
                {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
} 
