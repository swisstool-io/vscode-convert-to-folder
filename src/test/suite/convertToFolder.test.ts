import * as os from 'os';
import * as path from 'path';
import * as fsp from 'fs/promises';
import * as vscode from 'vscode';
import { expect } from 'chai';
import sinon from 'sinon';

const CMD = 'convertToFolder.convert';

async function createTempDir(): Promise<string> {
  return await fsp.mkdtemp(path.join(os.tmpdir(), 'ctf-test-'));
}

async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

suite('Convert to Folder', function () {
  this.timeout(30000);

  let sandbox: sinon.SinonSandbox;
  let testDir: string;

  suiteSetup(async function () {
    console.log('🔍 Looking for extension...');
    const ext = vscode.extensions.getExtension('SwissTool.convert-to-folder');
    
    if (!ext) {
      throw new Error('Extension not found');
    }
    
    console.log('✅ Extension found');
    if (!ext.isActive) {
      await ext.activate();
    }
    console.log('✅ Extension activated');
    
    // Verify CI environment variables
    console.log('🔧 CI env:', process.env.CI);
    console.log('🔧 GITHUB_ACTIONS env:', process.env.GITHUB_ACTIONS);
    
    // Give VS Code time to settle
    await wait(1000);
  });

  setup(async function () {
    sandbox = sinon.createSandbox();
    testDir = await createTempDir();
    console.log('📁 Test dir:', testDir);
    
    // Stub the interactive dialogs
    sandbox.stub(vscode.window, 'showQuickPick').resolves({ 
      label: 'Move contents into folder as "index"', 
      value: 'move' 
    } as any);
    
    sandbox.stub(vscode.window, 'showWarningMessage').resolves('Save & Continue' as any);
  });

  teardown(async function () {
    sandbox.restore();
    if (testDir) {
      await fsp.rm(testDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test('converts empty file to folder', async function () {
    const filePath = path.join(testDir, 'api');
    await fsp.writeFile(filePath, '', 'utf8');
    
    const fileUri = vscode.Uri.file(filePath);
    
    // Verify file exists
    const statBefore = await fsp.stat(filePath);
    console.log('✓ Before conversion - isFile:', statBefore.isFile());
    expect(statBefore.isFile()).to.be.true;
    
    // Call the command
    console.log('→ Calling command...');
    await vscode.commands.executeCommand(CMD, fileUri);
    console.log('✓ Command completed');
    
    await wait(1000);
    
    // Check if it's now a folder
    const statAfter = await fsp.stat(filePath);
    console.log('✓ After conversion - isDirectory:', statAfter.isDirectory());
    expect(statAfter.isDirectory()).to.be.true;
  });

  test('moves non-empty file contents to index', async function () {
    const filePath = path.join(testDir, 'config');
    const content = 'export const API_KEY = "test";';
    await fsp.writeFile(filePath, content, 'utf8');
    
    const fileUri = vscode.Uri.file(filePath);
    
    console.log('→ Converting file with content...');
    await vscode.commands.executeCommand(CMD, fileUri);
    await wait(1000);
    
    // Verify folder was created
    const folderStat = await fsp.stat(filePath);
    expect(folderStat.isDirectory()).to.be.true;
    
    // Verify index file contains the content
    const indexPath = path.join(filePath, 'index');
    const indexContent = await fsp.readFile(indexPath, 'utf8');
    console.log('✓ Index file content matches');
    expect(indexContent).to.equal(content);
  });

  test('deletes file contents when user chooses delete', async function () {
    const filePath = path.join(testDir, 'routes');
    await fsp.writeFile(filePath, 'some content', 'utf8');
    
    const fileUri = vscode.Uri.file(filePath);
    
    // Override stub for this test
    (sandbox as any).restore();
    sandbox.stub(vscode.window, 'showQuickPick').resolves({ 
      label: 'Delete contents and create empty folder', 
      value: 'delete' 
    } as any);
    
    await vscode.commands.executeCommand(CMD, fileUri);
    await wait(1000);
    
    // Verify folder exists
    const folderStat = await fsp.stat(filePath);
    expect(folderStat.isDirectory()).to.be.true;
    
    // Verify no index file exists
    const indexPath = path.join(filePath, 'index');
    let indexExists = false;
    try {
      await fsp.stat(indexPath);
      indexExists = true;
    } catch {
      indexExists = false;
    }
    expect(indexExists).to.be.false;
  });

  test('refuses to convert files with extensions', async function () {
    const filePath = path.join(testDir, 'app.ts');
    await fsp.writeFile(filePath, '', 'utf8');
    
    const fileUri = vscode.Uri.file(filePath);
    
    await vscode.commands.executeCommand(CMD, fileUri);
    await wait(500);
    
    // File should remain unchanged
    const stat = await fsp.stat(filePath);
    expect(stat.isFile()).to.be.true;
  });

  test('refuses to convert folders', async function () {
    const folderPath = path.join(testDir, 'alreadyafolder');
    await fsp.mkdir(folderPath);
    
    const folderUri = vscode.Uri.file(folderPath);
    
    await vscode.commands.executeCommand(CMD, folderUri);
    await wait(500);
    
    // Should still be a folder
    const stat = await fsp.stat(folderPath);
    expect(stat.isDirectory()).to.be.true;
  });

  test('cancels conversion when user cancels quick pick', async function () {
    const filePath = path.join(testDir, 'cancel-test');
    await fsp.writeFile(filePath, 'content', 'utf8');
    
    const fileUri = vscode.Uri.file(filePath);
    
    // User cancels
    (sandbox as any).restore();
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    
    await vscode.commands.executeCommand(CMD, fileUri);
    await wait(500);
    
    // File should remain unchanged
    const stat = await fsp.stat(filePath);
    expect(stat.isFile()).to.be.true;
  });
});
