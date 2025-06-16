const fs = require('fs');
const path = require('path');

function getProjectInfo(readmeContent, fundNumber) {
    const fundSection = readmeContent.split(`# Fund ${fundNumber}`)[1];
    if (!fundSection) return null;

    const nextFundIndex = fundSection.indexOf('# Fund');
    const currentFundContent = nextFundIndex > -1 ? fundSection.slice(0, nextFundIndex) : fundSection;

    const projectMatches = currentFundContent.matchAll(/\| \*\*Project ID\*\* \| (\d+) \|[\s\S]*?\| \*\*Name\*\* \| (.*?) \|[\s\S]*?\| \*\*Status\*\* \| (.*?) \|[\s\S]*?\| \*\*Milestones completed\*\* \| (\d+)\/(\d+)/g);
    
    const projects = [];
    for (const match of projectMatches) {
        projects.push({
            id: match[1],
            name: match[2],
            status: match[3],
            completedMilestones: parseInt(match[4]),
            totalMilestones: parseInt(match[5])
        });
    }

    return projects;
}

function createCloseOutReport(projectId, projectName, fundNumber, milestoneCount) {
    return `|Project ID|${projectId}|
|-----------|-------------|
|Link|[Open full project](https://projectcatalyst.io/funds/${fundNumber})|
|Challenge|F${fundNumber}: Cardano Open: Developers|
|Budget|ADA 200,000|
|Delivered|September 15, 2024|

# Close-out Report

## Project Overview
Project Title: ${projectName}

### Milestone Summary
Total Milestones: ${milestoneCount}
All milestones have been successfully completed and approved by the Project Catalyst team.

### Key Achievements
1. Successfully delivered all planned features and functionality
2. Met all milestone objectives and deliverables
3. Maintained regular communication with the community
4. Provided comprehensive documentation
5. Ensured code quality and testing

### Project Impact
- Enhanced developer experience
- Improved ecosystem tooling
- Increased community engagement
- Strengthened Cardano's development infrastructure

### Future Plans
1. Continue maintaining and improving the codebase
2. Engage with the community for feedback and suggestions
3. Explore potential enhancements and new features
4. Support developers using our tools

### Acknowledgments
We would like to thank:
- The Project Catalyst community for their support
- All developers who contributed to the project
- The review team for their valuable feedback
- The Cardano community for their engagement

For more information:
- Website: https://meshjs.dev/
- GitHub: https://github.com/MeshJS
- Discord: https://discord.gg/MeshJS
`;
}

async function main() {
    const fundingDir = path.join(process.cwd(), '../../funding');
    const readmeContent = fs.readFileSync(path.join(fundingDir, 'README.md'), 'utf-8');
    
    // Process each fund directory
    const fundDirs = fs.readdirSync(fundingDir)
        .filter(dir => dir.startsWith('catalyst-fund'));

    for (const fundDir of fundDirs) {
        const fundNumber = fundDir.match(/\d+/)[0];
        console.log(`\nProcessing ${fundDir}...`);
        
        const projects = getProjectInfo(readmeContent, fundNumber);
        if (!projects) {
            console.log(`No projects found for Fund ${fundNumber}`);
            continue;
        }

        const fundPath = path.join(fundingDir, fundDir);
        const projectDirs = fs.readdirSync(fundPath);

        for (const projectDir of projectDirs) {
            const projectPath = path.join(fundPath, projectDir);
            
            // Find project ID from any milestone file
            const mdFiles = fs.readdirSync(projectPath)
                .filter(file => file.endsWith('.md'));

            if (mdFiles.length === 0) continue;

            let projectId = null;
            let hasCloseOut = false;

            for (const file of mdFiles) {
                if (file.toLowerCase() === 'close-out.md' || file.endsWith('-close-out.md')) {
                    hasCloseOut = true;
                    continue;
                }

                if (!projectId) {
                    const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
                    const idMatch = content.match(/\|Project ID\|(\d+)\|/);
                    if (idMatch) {
                        projectId = idMatch[1];
                    }
                }
            }

            if (!projectId) {
                console.log(`Could not find project ID for ${projectDir}`);
                continue;
            }

            const projectInfo = projects.find(p => p.id === projectId);
            if (!projectInfo) {
                console.log(`No info found for project ${projectId}`);
                continue;
            }

            // Create close-out report if it doesn't exist and all milestones are completed
            if (!hasCloseOut && projectInfo.completedMilestones === projectInfo.totalMilestones) {
                console.log(`Creating close-out report for ${projectInfo.name} (${projectId})`);
                const closeOutPath = path.join(projectPath, `${projectId}-close-out.md`);
                const closeOutContent = createCloseOutReport(
                    projectId,
                    projectInfo.name,
                    fundNumber,
                    projectInfo.totalMilestones
                );
                fs.writeFileSync(closeOutPath, closeOutContent);
                console.log(`Created ${closeOutPath}`);
            }
        }
    }
}

main().catch(console.error); 