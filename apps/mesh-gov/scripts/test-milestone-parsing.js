const fs = require('fs');
const path = require('path');

function testMilestones() {
    const projectId = '1200147';
    const projectPath = path.join(process.cwd(), '../../funding/catalyst-fund12/new-features');
    console.log('Testing project path:', projectPath);

    const mdFiles = fs.readdirSync(projectPath)
        .filter(file => file.startsWith(`${projectId}-`) && file.endsWith('.md'));
    
    console.log('\nFound milestone files:', mdFiles);

    for (const file of mdFiles) {
        console.log(`\nReading ${file}:`);
        const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
        
        // Try to parse metadata table
        const tableMatch = content.match(/\|Project ID\|(\d+)\|/);
        const budgetMatch = content.match(/\|(?:Milestone )?Budget\|(.*?)\|/);
        const deliveredMatch = content.match(/\|Delivered\|(.*?)\|/);
        const challengeMatch = content.match(/\|Challenge\|(.*?)\|/);

        console.log('Metadata found:');
        console.log('- Project ID:', tableMatch?.[1]);
        console.log('- Budget:', budgetMatch?.[1]?.trim());
        console.log('- Delivered:', deliveredMatch?.[1]?.trim());
        console.log('- Challenge:', challengeMatch?.[1]?.trim());

        // Try to find content after metadata table
        const parts = content.split(/^#{1,6}\s+.*Report.*$/m);
        const mainContent = parts.length > 1 ? parts[1].trim() : content.trim();
        console.log('\nContent preview (first 100 chars):', mainContent.substring(0, 100));
    }
}

try {
    testMilestones();
} catch (error) {
    console.error('Error testing milestones:', error);
} 