const fs = require('fs');
const path = require('path');

function findProjectId(projectPath) {
    // Try to find project ID in any of the milestone files
    const mdFiles = fs.readdirSync(projectPath)
        .filter(file => file.endsWith('.md') || file === 'close-out');

    for (const file of mdFiles) {
        const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
        
        // Try different patterns for project ID
        const idMatch = content.match(/\|Project ID\|(\d+)\|/) ||
                       content.match(/\| Project ID \|(\d+)\|/) ||
                       content.match(/\|ProjectID\|(\d+)\|/) ||
                       content.match(/\| ProjectID \|(\d+)\|/);

        if (idMatch) {
            return idMatch[1];
        }

        // Try finding ID in nested markdown links
        const linkMatch = content.match(/projectcatalyst\.io\/projects\/(\d+)/);
        if (linkMatch) {
            return linkMatch[1];
        }
    }

    // If no ID found in files, try to infer from directory structure
    const fundMatch = projectPath.match(/catalyst-fund(\d+)/i);
    if (fundMatch) {
        const fundNumber = fundMatch[1].padStart(2, '0');
        // Look up project ID from README.md
        try {
            const readmePath = path.join(projectPath, '..', '..', 'README.md');
            const readmeContent = fs.readFileSync(readmePath, 'utf-8');
            const fundSection = readmeContent.split(`# Fund ${fundNumber}`)[1];
            if (fundSection) {
                const projectName = path.basename(projectPath).toLowerCase();
                const lines = fundSection.split('\n');
                for (const line of lines) {
                    if (line.toLowerCase().includes(projectName)) {
                        const idMatch = line.match(/\| (\d+) \|/);
                        if (idMatch) {
                            return idMatch[1];
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error reading README:', err);
        }
    }

    return null;
}

function renameFiles() {
    const fundingDir = path.join(process.cwd(), '../../funding');
    console.log('Funding directory:', fundingDir);

    // Get all fund directories
    const fundDirs = fs.readdirSync(fundingDir)
        .filter(dir => dir.startsWith('catalyst-fund'));

    const failedDirs = [];

    for (const fundDir of fundDirs) {
        const fundPath = path.join(fundingDir, fundDir);
        console.log(`\nProcessing fund directory: ${fundDir}`);
        
        const projectDirs = fs.readdirSync(fundPath);

        for (const projectDir of projectDirs) {
            const projectPath = path.join(fundPath, projectDir);
            console.log(`\nChecking project directory: ${projectDir}`);
            
            const mdFiles = fs.readdirSync(projectPath)
                .filter(file => file.endsWith('.md') || file === 'close-out');

            if (mdFiles.length > 0) {
                // Skip files that are already renamed
                if (mdFiles.every(file => /^\d+/.test(file))) {
                    console.log('Files already renamed, skipping...');
                    continue;
                }

                const projectId = findProjectId(projectPath);
                
                if (projectId) {
                    console.log(`Found project ID: ${projectId}`);

                    // Rename each file to include the project ID
                    for (const file of mdFiles) {
                        // Skip if already renamed
                        if (file.startsWith(projectId)) {
                            continue;
                        }

                        const oldPath = path.join(projectPath, file);
                        let newFileName;

                        if (file === 'close-out.md' || file === 'close-out') {
                            newFileName = `${projectId}-close-out.md`;
                        } else {
                            // Keep the milestone number but add project ID
                            const milestoneMatch = file.match(/milestone(\d+)\.md/);
                            if (milestoneMatch) {
                                newFileName = `${projectId}-milestone${milestoneMatch[1]}.md`;
                            } else {
                                continue;
                            }
                        }

                        const newPath = path.join(projectPath, newFileName);
                        console.log(`Renaming ${file} to ${newFileName}`);
                        
                        try {
                            fs.renameSync(oldPath, newPath);
                        } catch (err) {
                            console.error(`Error renaming ${file}:`, err);
                        }
                    }
                } else {
                    console.log('No project ID found in files');
                    failedDirs.push(`${fundDir}/${projectDir}`);
                }
            }
        }
    }

    if (failedDirs.length > 0) {
        console.log('\nFailed to find project IDs for the following directories:');
        failedDirs.forEach(dir => console.log(`- ${dir}`));
    }
}

try {
    renameFiles();
    console.log('\nFile renaming completed!');
} catch (error) {
    console.error('Error during file renaming:', error);
} 