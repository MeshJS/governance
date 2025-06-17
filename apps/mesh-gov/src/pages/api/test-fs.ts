import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const projectId = '1200220'; // Fund 12 Sustain and Maintain Mesh SDK
        const fundingDir = path.join(process.cwd(), '../../funding');
        console.log('Current working directory:', process.cwd());
        console.log('Funding directory:', fundingDir);
        console.log('Directory exists:', fs.existsSync(fundingDir));

        if (!fs.existsSync(fundingDir)) {
            res.status(404).json({ error: 'Funding directory not found', path: fundingDir });
            return;
        }

        // List all fund directories
        const fundDirs = fs.readdirSync(fundingDir)
            .filter(dir => dir.startsWith('catalyst-fund'));
        console.log('Fund directories:', fundDirs);

        // Check each fund directory
        for (const fundDir of fundDirs) {
            const fundPath = path.join(fundingDir, fundDir);
            console.log(`\nChecking fund directory: ${fundDir}`);
            
            const projectDirs = fs.readdirSync(fundPath);
            console.log('Project directories:', projectDirs);

            for (const projectDir of projectDirs) {
                const projectPath = path.join(fundPath, projectDir);
                console.log(`\nChecking project directory: ${projectDir}`);
                
                const files = fs.readdirSync(projectPath)
                    .filter(file => file.endsWith('.md') || file === 'close-out');
                console.log('Markdown files:', files);

                // Check first file for project ID
                if (files.length > 0) {
                    const firstFile = files[0];
                    const content = fs.readFileSync(path.join(projectPath, firstFile), 'utf-8');
                    const idMatch = content.match(/\|Project ID\|(\d+)\|/);
                    console.log(`Project ID in ${firstFile}:`, idMatch?.[1]);

                    if (idMatch && idMatch[1] === projectId) {
                        console.log('\nFOUND TARGET PROJECT!');
                        console.log('Project path:', projectPath);
                        console.log('All files:', files);

                        // Read and log the content of each file
                        for (const file of files) {
                            console.log(`\nReading ${file}:`);
                            const fileContent = fs.readFileSync(path.join(projectPath, file), 'utf-8');
                            console.log('First 200 chars:', fileContent.substring(0, 200));
                            
                            // Check metadata
                            const metadata = {
                                projectId: fileContent.match(/\|Project ID\|(\d+)\|/)?.[1],
                                budget: fileContent.match(/\|(?:Milestone )?Budget\|(.*?)\|/)?.[1],
                                delivered: fileContent.match(/\|Delivered\|(.*?)\|/)?.[1],
                                challenge: fileContent.match(/\|Challenge\|(.*?)\|/)?.[1]
                            };
                            console.log('Metadata:', metadata);
                        }
                    }
                }
            }
        }

        res.status(200).json({
            message: 'Check server logs for detailed output',
            cwd: process.cwd(),
            fundingDir,
            exists: fs.existsSync(fundingDir)
        });
    } catch (error) {
        console.error('Error testing file system:', error);
        res.status(500).json({ error: String(error) });
    }
} 