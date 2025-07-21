// Frontend configuration that imports the main org-stats-config.json
import config from '../../org-stats-config.json';

// Type definitions for the config
interface SocialLink {
    name: string;
    url: string;
}

interface BuilderProject {
    id: string;
    icon: string;
    url: string;
}

interface HighlightedProject {
    id: string;
    name: string;
    description: string;
    icon: string;
    url: string;
    category?: string;
}

interface ShowcaseRepo {
    name: string;
    description: string;
    icon: string;
    url: string;
}

interface LogoConfig {
    src: string;
    width: number;
    height: number;
}

interface Organization {
    name: string;
    displayName: string;
    logo: LogoConfig;
    logoWithName: LogoConfig;
    excludedRepos: string[];
}

interface ExtendedOrganization {
    name: string;
    displayName: string;
    excludedRepos: string[];
}

interface OrgStatsConfig {
    mainOrganization: Organization;
    extendedOrganizations: ExtendedOrganization[];
    socialLinks: SocialLink[];
    repositories: {
        governance: string;
        dependentsCountRepo: string;
    };
    poolId: string;
    drepId: string;
    catalystProjectIds: string;
    discordGuildId: string;
    npmPackages: {
        [key: string]: string;
    };
    builderProjects: BuilderProject[];
    highlightedProjects: HighlightedProject[];
    showcaseRepos: ShowcaseRepo[];
}

export default config as OrgStatsConfig; 