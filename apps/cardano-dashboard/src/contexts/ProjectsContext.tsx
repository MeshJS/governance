// contexts/ProjectsContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ProjectsContextType, ProjectRecord, ProjectContributorActivity } from 'types/projects';

export function useProjectsContext() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error('useProjectsContext must be used within a ProjectsProvider');
    return ctx;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

type ProjectsProviderProps = {
    children: React.ReactNode;
    fetchOptions?: {
        fetchProjects?: boolean;
        fetchContributorActivity?: boolean;
        specificProject?: ProjectRecord; // For fetching contributor activity for a specific project
    };
};

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children, fetchOptions = {} }) => {
    const [isClient, setIsClient] = useState(false);
    // Intentionally avoid inheriting from parent context to prevent nested re-fetches
    useContext(ProjectsContext);

    // Respect the explicit fetch options provided to this provider.
    // Do not inherit/override from parent context, to avoid nested providers re-fetching.
    const mergedFetchOptions = {
        fetchProjects: Boolean(fetchOptions.fetchProjects),
        fetchContributorActivity: Boolean(fetchOptions.fetchContributorActivity),
        specificProject: fetchOptions.specificProject,
    } as const;

    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [contributorActivity, setContributorActivity] = useState<ProjectContributorActivity[]>([]);
    const [loading, setLoading] = useState({
        projects: Boolean(mergedFetchOptions.fetchProjects),
        contributorActivity: Boolean(mergedFetchOptions.fetchContributorActivity),
    });
    const [error, setError] = useState({ projects: null as Error | null, contributorActivity: null as Error | null });
    const [isError, setIsError] = useState({ projects: false, contributorActivity: false });
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchProjects = useCallback(async () => {
        if (!mergedFetchOptions.fetchProjects) return;

        setLoading(prev => ({ ...prev, projects: true }));
        setError(prev => ({ ...prev, projects: null }));
        setIsError(prev => ({ ...prev, projects: false }));

        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }

            const data = await response.json();
            if ('error' in data) {
                throw new Error(data.error);
            }

            setProjects(data.projects || []);
            setLastUpdated(new Date());
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch projects');
            setError(prev => ({ ...prev, projects: error }));
            setIsError(prev => ({ ...prev, projects: true }));
            console.error('Projects fetch error:', error);
        } finally {
            setLoading(prev => ({ ...prev, projects: false }));
        }
    }, [mergedFetchOptions.fetchProjects]);

    const fetchContributorActivity = useCallback(async () => {
        if (!mergedFetchOptions.fetchContributorActivity) return;

        // Determine which projects to fetch contributor activity for
        const projectsToFetch = mergedFetchOptions.specificProject
            ? [mergedFetchOptions.specificProject]
            : projects;

        // Don't fetch if we don't have projects data yet (unless we have a specific project)
        if (projectsToFetch.length === 0) {
            console.log('Skipping contributor activity fetch - no projects data yet');
            return;
        }

        setLoading(prev => ({ ...prev, contributorActivity: true }));
        setError(prev => ({ ...prev, contributorActivity: null }));
        setIsError(prev => ({ ...prev, contributorActivity: false }));

        try {
            console.log('Fetching contributor activity with projects:', projectsToFetch.length);

            const response = await fetch('/api/projects/contributor-activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projects: projectsToFetch }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch contributor activity: ${response.statusText}`);
            }

            const data = await response.json();

            if ('error' in data) {
                throw new Error(data.error);
            }

            setContributorActivity(data.projects || []);
            setLastUpdated(new Date());
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch contributor activity');
            setError(prev => ({ ...prev, contributorActivity: error }));
            setIsError(prev => ({ ...prev, contributorActivity: true }));
            console.error('Contributor activity fetch error:', error);
        } finally {
            setLoading(prev => ({ ...prev, contributorActivity: false }));
        }
    }, [mergedFetchOptions.fetchContributorActivity, mergedFetchOptions.specificProject, projects]);

    const refresh = async () => {
        if (mergedFetchOptions.fetchProjects) {
            await fetchProjects();
        }
        if (mergedFetchOptions.fetchContributorActivity) {
            await fetchContributorActivity();
        }
    };

    // Set isClient to true after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Ensure we only fetch once per provider mount
    const hasFetchedProjectsRef = useRef(false);
    const hasFetchedContributorActivityRef = useRef(false);

    // Fetch projects data on mount and when fetch options change
    useEffect(() => {
        if (isClient && mergedFetchOptions.fetchProjects && !hasFetchedProjectsRef.current) {
            hasFetchedProjectsRef.current = true;
            fetchProjects();
        }
    }, [isClient, mergedFetchOptions.fetchProjects, fetchProjects]);

    // Fetch contributor activity when projects data becomes available or when we have a specific project
    useEffect(() => {
        if (!isClient || !mergedFetchOptions.fetchContributorActivity) return;

        const shouldFetch = mergedFetchOptions.specificProject
            ? true // We have a specific project, fetch immediately
            : projects.length > 0; // We need to wait for projects to load

        if (shouldFetch && !hasFetchedContributorActivityRef.current) {
            hasFetchedContributorActivityRef.current = true;
            fetchContributorActivity();
        }
    }, [isClient, mergedFetchOptions.fetchContributorActivity, mergedFetchOptions.specificProject, projects.length, fetchContributorActivity]);

    // Log errors when they occur
    useEffect(() => {
        if (isError.projects) {
            console.error('Projects error:', error.projects);
        }
        if (isError.contributorActivity) {
            console.error('Contributor activity error:', error.contributorActivity);
        }
    }, [isError.projects, error.projects, isError.contributorActivity, error.contributorActivity]);

    // Create a consistent initial state
    const contextValue: ProjectsContextType = {
        projects: isClient ? projects : [],
        contributorActivity: isClient ? contributorActivity : [],
        loading: {
            projects: mergedFetchOptions.fetchProjects ? (!isClient || loading.projects) : false,
            contributorActivity: mergedFetchOptions.fetchContributorActivity ? (!isClient || loading.contributorActivity) : false,
        },
        error: {
            projects: error.projects,
            contributorActivity: error.contributorActivity,
        },
        isError: {
            projects: isError.projects,
            contributorActivity: isError.contributorActivity,
        },
        lastUpdated,
        refresh,
    };

    return (
        <ProjectsContext.Provider value={contextValue}>
            {children}
        </ProjectsContext.Provider>
    );
};
