import fs from 'fs';
import path from 'path';

const DATA_DIR = 'mesh-gov-updates/catalyst-proposals';

/**
 * Saves the catalyst data to a JSON file
 * @param {Array} projects - Array of project data
 */
export async function saveCatalystData(projects) {
    // Ensure the directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Get current timestamp for filename
    const now = new Date();
    const filePath = path.join(DATA_DIR, `catalyst-data.json`);

    // Prepare the data structure
    const data = {
        timestamp: now.toISOString(),
        projects: projects.map(project => ({
            projectDetails: project.projectDetails,
            milestonesCompleted: project.milestonesCompleted
        }))
    };

    // Write the data to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved catalyst data to ${filePath}`);
}