const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, './suite');

    console.log('Starting extension tests...');
    console.log('Extension path:', extensionDevelopmentPath);
    console.log('Tests path:', extensionTestsPath);

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-gpu', '--disable-extensions', '--disable-web-security'],
      timeout: 300000 // 5 minute timeout
    });
    
    console.log('Tests completed successfully');
  } catch (err) {
    console.error('Failed to run tests');
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
