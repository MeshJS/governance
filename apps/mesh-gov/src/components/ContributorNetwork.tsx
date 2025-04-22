import { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from '../styles/ContributorNetwork.module.css';
import { Contributor as DataContributor } from '../types';

interface ContributorNetworkProps {
    contributors: DataContributor[];
}

interface NodeData extends Record<string, unknown> {
    label: string;
    contributions?: number;
    contributorCount?: number;
}

const RepositoryNode = ({ data }: { data: NodeData }) => (
    <div className={styles.repositoryNode}>
        <div className={styles.repoName}>{data.label}</div>
        <div className={styles.stats}>
            <div className={styles.stat}>
                <span className={styles.statLabel}>Contributors:</span>
                <span className={styles.statValue}>{data.contributorCount}</span>
            </div>
            <div className={styles.stat}>
                <span className={styles.statLabel}>Contributions:</span>
                <span className={styles.statValue}>{data.contributions}</span>
            </div>
        </div>
    </div>
);

const nodeTypes = {
    repository: RepositoryNode,
};

const ContributorNetwork: React.FC<ContributorNetworkProps> = ({ contributors }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const generateNodes = useCallback(() => {
        const newNodes: Node<NodeData>[] = [];
        const nodePositions = new Map<string, { x: number, y: number }>();

        // Get all unique repositories
        const meshRepos = new Set<string>();
        contributors.forEach(contributor => {
            contributor.repositories.forEach(repo => {
                meshRepos.add(repo.name);
            });
        });

        // Calculate grid dimensions
        const repos = Array.from(meshRepos);
        const gridSize = Math.ceil(Math.sqrt(repos.length));
        const spacing = 200;

        // Create repository nodes in grid formation
        repos.forEach((repo, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const x = col * spacing;
            const y = row * spacing;
            nodePositions.set(repo, { x, y });

            // Calculate total contributions and contributor count for this repo
            const repoData = contributors.reduce((acc, contributor) => {
                const repoContributions = contributor.repositories.find(r => r.name === repo)?.contributions || 0;
                if (repoContributions > 0) {
                    acc.contributions += repoContributions;
                    acc.contributorCount += 1;
                }
                return acc;
            }, { contributions: 0, contributorCount: 0 });

            newNodes.push({
                id: `repo-${repo}`,
                type: 'repository',
                position: { x, y },
                data: {
                    label: repo,
                    contributions: repoData.contributions,
                    contributorCount: repoData.contributorCount,
                },
            });
        });

        setNodes(newNodes);
        setEdges([]); // Set empty edges array
    }, [contributors]);

    useMemo(() => {
        generateNodes();
    }, [generateNodes]);

    return (
        <div className={styles.networkContainer}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background />
                <Controls
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                    }}
                />
            </ReactFlow>
        </div>
    );
};

export default ContributorNetwork; 