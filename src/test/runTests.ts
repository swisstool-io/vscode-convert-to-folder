/**
 * Test Runner for Convert to Folder Extension
 * 
 * Downloads VS Code, loads the extension, and executes the test suite.
 * This is the entry point invoked by `npm test`.
 */
import * as path from 'path';
import { runTests, downloadAndUnzipVSCode } from '@vscode/test-electron';

/**
 * Main test execution function.
 * Sets up the VS Code environment and runs all tests.
 */
async function main(): Promise<void> {
  try {
    // Extension root directory containing package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // Compiled test suite entry point
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code if not already cached
    await downloadAndUnzipVSCode('stable');

    // Run the test suite with CI-friendly flags
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Electron flags make CI more stable; harmless locally
      launchArgs: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
    });
  } catch (err: unknown) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
