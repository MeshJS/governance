export type ProjectInput = {
    id?: string;
    slug: string;
    name: string;
    description: string;
    url: string;
    icon_url: string;
    category: string;
    is_active: boolean;
};

export type ProjectRecord = ProjectInput & {
    id: string;
    created_at: string;
    updated_at: string;
    config?: unknown;
    owner_wallets?: string[] | null;
    owner_nft_policy_ids?: string[] | null;
};

export type Logo = { src: string; width: number; height: number };

export type MainOrganization = {
    name: string;
    displayName: string;
    logo: Logo;
    logoWithName: Logo;
    excludedRepos: string[];
};

export type ExtendedOrganization = { name: string; displayName: string; excludedRepos: string[] };

export type NpmPackage = { key: string; name: string; github_package_id?: string; dependents_url?: string };

export type SocialLink = { name: string; url: string };

export type BuilderProject = { id: string; icon: string; url: string };

export type HighlightedProject = { id: string; name: string; description: string; icon: string; url: string; category?: string };

export type ShowcaseRepo = { id: string; name: string; description: string; icon: string; url: string; category: string };

export type OrgStatsConfig = {
    mainOrganization: MainOrganization;
    extendedOrganizations: ExtendedOrganization[];
    poolId: string;
    drepId: string;
    catalystProjectIds: string;
    npmPackages: NpmPackage[];
    socialLinks: SocialLink[];
    builderProjects: BuilderProject[];
    highlightedProjects: HighlightedProject[];
    showcaseRepos: ShowcaseRepo[];
};


