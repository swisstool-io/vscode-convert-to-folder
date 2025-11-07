import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

/**
 * Test runner entry point.
 * Configures Mocha, discovers test files, and executes all tests.
 */
export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 90000,   // 90 seconds for CI
    slow: 15000,      // Consider tests slow after 15s
    retries: 2,       // Retry flaky tests twice
  });

  const testsRoot = path.resolve(__dirname);

  return (async () => {
    // Discover all compiled test files in the current directory
    const files = await glob('**/*.test.js', { cwd: testsRoot });
    
    // Register each test file with Mocha
    files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)));

    // Execute tests and handle results
    return new Promise<void>((resolve, reject) => {
      try {
        mocha.run((failures: number) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  })();
}
