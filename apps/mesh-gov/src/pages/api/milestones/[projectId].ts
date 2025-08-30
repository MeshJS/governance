import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Get the absolute path to the funding directory
function getFundingDir() {
  // Try different possible locations
  const possiblePaths = [
    // Direct from workspace root
    path.join(process.cwd(), 'funding'),
    // From app directory
    path.join(process.cwd(), '..', '..', 'funding'),
    // From Next.js app directory
    path.join(process.cwd(), 'apps', 'mesh-gov', '..', '..', 'funding'),
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      console.log('Found funding directory at:', dir);
      return dir;
    }
    console.log('Tried funding directory at:', dir);
  }

  throw new Error('Funding directory not found in any of the expected locations');
}

export interface MilestoneData {
  number: number;
  budget: string;
  delivered: string;
  projectId: string;
  link: string;
  challenge: string;
  content: string;
  isCloseOut?: boolean;
}

function findMilestoneFiles(fundingDir: string, projectId: string): string[] {
  console.log(`Looking for milestone files for project ID ${projectId} in ${fundingDir}`);

  const allFiles: string[] = [];

  try {
    // Search through all fund directories
    const fundDirs = fs.readdirSync(fundingDir).filter(dir => dir.startsWith('catalyst-fund'));

    console.log('Found fund directories:', fundDirs);

    for (const fundDir of fundDirs) {
      const fundPath = path.join(fundingDir, fundDir);

      try {
        const projectDirs = fs.readdirSync(fundPath);
        console.log(`Checking fund directory ${fundDir}, found projects:`, projectDirs);

        for (const projectDir of projectDirs) {
          const projectPath = path.join(fundPath, projectDir);

          try {
            // Try to find files with new naming pattern first
            let mdFiles = fs
              .readdirSync(projectPath)
              .filter(
                file =>
                  file.startsWith(`${projectId}-`) && (file.endsWith('.md') || file === 'close-out')
              );

            // If no files found with new pattern, check old pattern and verify project ID in content
            if (mdFiles.length === 0) {
              const oldFiles = fs
                .readdirSync(projectPath)
                .filter(
                  file =>
                    (file.startsWith('milestone') ||
                      file === 'close-out.md' ||
                      file === 'close-out') &&
                    (file.endsWith('.md') || file === 'close-out')
                );

              if (oldFiles.length > 0) {
                // Check if any file contains the correct project ID
                for (const file of oldFiles) {
                  try {
                    const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
                    const idMatch =
                      content.match(/\|Project ID\|(\d+)\|/) ||
                      content.match(/\| Project ID \|(\d+)\|/) ||
                      content.match(/\|ProjectID\|(\d+)\|/) ||
                      content.match(/\| ProjectID \|(\d+)\|/);

                    if (idMatch && idMatch[1] === projectId) {
                      mdFiles = oldFiles;
                      break;
                    }
                  } catch (err) {
                    console.error(`Error reading file ${file}:`, err);
                  }
                }
              }
            }

            if (mdFiles.length > 0) {
              console.log(`Found milestone files in ${projectDir}:`, mdFiles);
              allFiles.push(...mdFiles.map(file => path.join(projectPath, file)));
            }
          } catch (err) {
            console.error(`Error accessing project directory ${projectDir}:`, err);
          }
        }
      } catch (err) {
        console.error(`Error accessing fund directory ${fundDir}:`, err);
      }
    }
  } catch (err) {
    console.error('Error accessing funding directory:', err);
    throw err;
  }

  return allFiles;
}

function extractContent(content: string): string {
  try {
    // Split by any heading that contains "Report" (with any number of #)
    const parts = content.split(/^#{1,6}\s+.*Report.*$/m);

    if (parts.length > 1) {
      // Take everything after the first "Report" heading
      return parts.slice(1).join('\n').trim();
    }

    // Fallback: try splitting by any heading
    const fallbackParts = content.split(/^#{1,6}\s+/m);
    if (fallbackParts.length > 1) {
      // Take everything after the first heading
      return fallbackParts.slice(1).join('\n').trim();
    }

    // If no headings found, return everything after the metadata table
    const tableEndIndex = content.indexOf('\n\n');
    if (tableEndIndex !== -1) {
      return content.slice(tableEndIndex).trim();
    }

    return content.trim();
  } catch (err) {
    console.error('Error extracting content:', err);
    return '';
  }
}

function parseMilestoneFile(
  content: string,
  fileName: string
): Omit<MilestoneData, 'number'> | null {
  try {
    // Try different patterns for project ID, including nested markdown links
    const projectIdMatch =
      content.match(/\|Project ID\|(\d+)\|/) ||
      content.match(/\| Project ID \|(\d+)\|/) ||
      content.match(/\|ProjectID\|(\d+)\|/) ||
      content.match(/\| ProjectID \|(\d+)\|/);

    // Try different patterns for budget
    const budgetMatch =
      content.match(/\|Milestone Budget\|(.*?)\|/) ||
      content.match(/\| Milestone Budget \|(.*?)\|/) ||
      content.match(/\|Budget\|(.*?)\|/) ||
      content.match(/\| Budget \|(.*?)\|/);

    // Try different patterns for delivery date
    const deliveredMatch =
      content.match(/\|Delivered\|(.*?)\|/) ||
      content.match(/\| Delivered \|(.*?)\|/) ||
      content.match(/\|Milestone Delivered\|(.*?)\|/) ||
      content.match(/\| Milestone Delivered \|(.*?)\|/) ||
      content.match(/\|Due Date\|(.*?)\|/) ||
      content.match(/\| Due Date \|(.*?)\|/);

    // Try different patterns for links, including nested markdown links
    const linkMatch = content.match(
      /\|(?:Milestone|Milestones|Link)\|\[(.*?)\](?:\((.*?)\)(?:\]\((.*?)\))?)\|/
    );

    // Try different patterns for challenge
    const challengeMatch =
      content.match(/\|Challenge\|(.*?)\|/) || content.match(/\| Challenge \|(.*?)\|/);

    if (!projectIdMatch) {
      console.log(`No project ID found in file ${fileName}`);
      return null;
    }

    const mainContent = extractContent(content);

    if (!mainContent) {
      console.log(`No content found after heading in file ${fileName}`);
    }

    // Extract the actual link from nested markdown links
    let link = '';
    if (linkMatch) {
      // If there's a nested link, take the last URL
      const urls = linkMatch[0].match(/\(([^)]+)\)/g);
      if (urls) {
        link = urls[urls.length - 1].slice(1, -1);
      }
    }

    return {
      projectId: projectIdMatch[1],
      budget: budgetMatch?.[1]?.trim() || '',
      delivered: deliveredMatch?.[1]?.trim() || '',
      link: link,
      challenge: challengeMatch?.[1]?.trim() || '',
      content: mainContent,
      isCloseOut: fileName.includes('close-out'),
    };
  } catch (err) {
    console.error(`Error parsing milestone file ${fileName}:`, err);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MilestoneData[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const { projectId } = req.query;
  if (!projectId || Array.isArray(projectId)) {
    res.status(400).json({ error: 'Invalid project ID' });
    return;
  }

  try {
    console.log('Starting milestone search for project ID:', projectId);

    let fundingDir;
    try {
      fundingDir = getFundingDir();
    } catch (err) {
      console.error('Error finding funding directory:', err);
      res.status(500).json({ error: 'Funding directory not found' });
      return;
    }

    const milestoneFiles = findMilestoneFiles(fundingDir, projectId);
    console.log('Found milestone files:', milestoneFiles);

    if (milestoneFiles.length === 0) {
      console.log('No milestone files found');
      res.status(404).json({ error: 'No milestone files found' });
      return;
    }

    const milestones: MilestoneData[] = [];

    for (const filePath of milestoneFiles) {
      const fileName = path.basename(filePath);
      console.log(`Processing file: ${fileName}`);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const milestone = parseMilestoneFile(content, fileName);

        if (milestone) {
          console.log(`Successfully parsed milestone from ${fileName}`);
          if (fileName.includes('close-out')) {
            milestones.push({
              ...milestone,
              number: 9999, // Put close-out report at the end
            });
          } else {
            const numberMatch = fileName.match(/milestone(\d+)/);
            if (numberMatch) {
              milestones.push({
                ...milestone,
                number: parseInt(numberMatch[1]),
              });
            }
          }
        } else {
          console.log(`Failed to parse milestone from ${fileName}`);
        }
      } catch (err) {
        console.error(`Error processing file ${fileName}:`, err);
      }
    }

    if (milestones.length === 0) {
      console.log('No milestones could be parsed');
      res.status(404).json({ error: 'No milestones could be parsed' });
      return;
    }

    console.log(`Found ${milestones.length} milestones`);
    // Sort milestones by number, ensuring close-out reports appear at the end
    const sortedMilestones = milestones.sort((a, b) => {
      if (a.isCloseOut) return 1;
      if (b.isCloseOut) return -1;
      return a.number - b.number;
    });
    res.status(200).json(sortedMilestones);
  } catch (error) {
    console.error('Error reading milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
