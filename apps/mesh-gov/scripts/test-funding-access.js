const fs = require('fs');
const path = require('path');

function findFundingDir() {
  const paths = [
    path.join(__dirname, '../../funding'),
    path.join(__dirname, '../funding'),
    path.join(__dirname, 'funding'),
    path.join(__dirname, '../../../funding'),
    path.join(__dirname, '../../../../funding'),
    path.join(__dirname, '../../../../../funding'),
  ];

  console.log('Current directory:', __dirname);
  console.log('Trying paths:', paths);

  for (const p of paths) {
    console.log('\nChecking path:', p);
    if (fs.existsSync(p)) {
      console.log('Directory exists!');
      try {
        const contents = fs.readdirSync(p);
        console.log('Directory contents:', contents);
        if (contents.some(dir => dir.startsWith('catalyst-fund'))) {
          console.log('Found funding directory with catalyst-fund* directories');
          return p;
        }
      } catch (err) {
        console.error('Error reading directory:', err);
      }
    } else {
      console.log('Directory does not exist');
    }
  }

  throw new Error('Could not find funding directory');
}

function testMilestonesAccess() {
  const fundingDir = findFundingDir();
  console.log('\nFound funding directory at:', fundingDir);

  // Test accessing Fund 12 Sustain and Maintain Mesh SDK (ID: 1200220)
  const projectId = '1200220';
  console.log(`\nLooking for project ID ${projectId}`);

  const fundDirs = fs.readdirSync(fundingDir).filter(dir => dir.startsWith('catalyst-fund'));
  console.log('Fund directories:', fundDirs);

  for (const fundDir of fundDirs) {
    const fundPath = path.join(fundingDir, fundDir);
    console.log(`\nChecking fund directory: ${fundDir}`);

    const projectDirs = fs.readdirSync(fundPath);
    console.log('Project directories:', projectDirs);

    for (const projectDir of projectDirs) {
      const projectPath = path.join(fundPath, projectDir);
      console.log(`\nChecking project directory: ${projectDir}`);

      const mdFiles = fs
        .readdirSync(projectPath)
        .filter(file => file.endsWith('.md') || file === 'close-out');
      console.log('Markdown files:', mdFiles);

      if (mdFiles.length > 0) {
        const firstFileContent = fs.readFileSync(path.join(projectPath, mdFiles[0]), 'utf-8');
        const idMatch = firstFileContent.match(/\|Project ID\|(\d+)\|/);
        console.log('Found project ID:', idMatch?.[1]);

        if (idMatch && idMatch[1] === projectId) {
          console.log('\nFOUND THE PROJECT!');
          console.log('Project path:', projectPath);
          console.log('Available files:', mdFiles);

          // Read and log the content of each file
          for (const file of mdFiles) {
            console.log(`\nReading ${file}:`);
            const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
            console.log('First 200 chars:', content.substring(0, 200));
          }
          return;
        }
      }
    }
  }

  console.log('Project not found');
}

testMilestonesAccess();
