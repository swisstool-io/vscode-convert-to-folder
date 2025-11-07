import * as vscode from 'vscode';
import * as path from 'path';

const TEMP_FILE_SUFFIX = '.tmp_';
const INDEX_FILE_NAME = 'index';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

/**
 * Activates the Convert to Folder extension.
 * Registers the command that converts extension-less files into folders.
 */
export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand('convertToFolder.convert', async (uri?: vscode.Uri) => {
    try {      
      // Get target file URI from context menu or active editor
      if (!uri) {
        const active = vscode.window.activeTextEditor?.document.uri;
        if (!active) {
          vscode.window.showInformationMessage('No file selected.');
          return;
        }
        uri = active;
      }

      // Only work with local filesystem (not remote, virtual, etc.)
      if (uri.scheme !== 'file') {
        vscode.window.showWarningMessage('Only local files can be converted to folders.');
        return;
      }

      // Verify file is inside a workspace folder (skip check in CI/test environment)
      if (!IS_CI) {
        const workspace = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspace) {
          vscode.window.showWarningMessage('File must be inside the workspace to convert.');
          return;
        }
      } else {
      }

      // Verify target is a file, not already a folder
      const stat = await vscode.workspace.fs.stat(uri);      
      if (stat.type !== vscode.FileType.File) {
        vscode.window.showWarningMessage('Target must be a file, not a folder.');
        return;
      }

      const filePath = uri.fsPath;
      const parsed = path.parse(filePath);

      // Extension check: only convert files without extensions
      // This prevents accidentally converting source files like "index.ts"
      if (parsed.ext) {
        vscode.window.showInformationMessage(
          'Only files without extensions can be converted to folders.'
        );
        return;
      }

      // Check if file is open with unsaved changes
      const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === filePath);
      if (doc?.isDirty) {
        const choice = await vscode.window.showWarningMessage(
          'This file has unsaved changes. Save before converting?',
          'Save & Continue',
          'Cancel'
        );
        if (choice !== 'Save & Continue') {
          return;
        }
        
        const saved = await doc.save();
        if (!saved) {
          return;
        }
      }

      const folderUri = vscode.Uri.file(path.join(parsed.dir, parsed.name));

      // Prevent overwriting existing folder
      try {
        const existing = await vscode.workspace.fs.stat(folderUri);
        if (existing.type === vscode.FileType.Directory) {
          vscode.window.showErrorMessage(`Folder "${parsed.name}" already exists.`);
          return;
        }
      } catch {
        // Folder doesn't exist, we can proceed
      }

      const isEmpty = stat.size === 0;

      if (isEmpty) {
        // Simple case: replace empty file with empty folder
        await vscode.workspace.fs.delete(uri, { useTrash: !IS_CI });
        await vscode.workspace.fs.createDirectory(folderUri);
      } else {
        // File has content, ask user what to do
        const choice = await vscode.window.showQuickPick(
          [
            {
              label: 'Move contents into folder as "index"',
              description: 'Preserves file content',
              value: 'move'
            },
            {
              label: 'Delete contents and create empty folder',
              description: 'File content will be lost',
              value: 'delete'
            },
            {
              label: 'Cancel',
              value: 'cancel'
            }
          ],
          { placeHolder: `File "${parsed.name}" contains data. Choose an action:` }
        );

        if (!choice || choice.value === 'cancel') {
          return;
        }

        if (choice.value === 'delete') {
          await vscode.workspace.fs.delete(uri, { useTrash: !IS_CI });
          await vscode.workspace.fs.createDirectory(folderUri);
        } else {
          // Move file content to folder/index
          await moveFileIntoFolder(uri, folderUri);
        }
      }

      // In CI, skip UI-only commands that can cancel the host
      if (!IS_CI) {
        await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        await vscode.commands.executeCommand('revealInExplorer', folderUri);
      }
      
      vscode.window.showInformationMessage(`Converted "${parsed.name}" to folder.`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to convert: ${err.message || err}`);
    }
  });

  context.subscriptions.push(cmd);
}

/**
 * Moves a file into a new folder as "index" (without extension).
 * 
 * Strategy:
 * 1. Rename file to temporary location (atomic operation)
 * 2. Create the destination folder
 * 3. Move temp file into folder as "index"
 * 4. If steps 2-3 fail, rollback by restoring original file
 * 
 * This approach is safe - the original file is never deleted
 * until the new structure is successfully created.
 */
async function moveFileIntoFolder(fileUri: vscode.Uri, folderUri: vscode.Uri): Promise<void> {
  const tempUri = vscode.Uri.file(fileUri.fsPath + TEMP_FILE_SUFFIX + Date.now());
  
  try {
    // Rename file to temp location
    await vscode.workspace.fs.rename(fileUri, tempUri, { overwrite: false });
    
    try {
      // Create the folder
      await vscode.workspace.fs.createDirectory(folderUri);
      
      // Move temp file into folder as "index"
      const indexUri = vscode.Uri.file(path.join(folderUri.fsPath, INDEX_FILE_NAME));
      await vscode.workspace.fs.rename(tempUri, indexUri, { overwrite: false });
    } catch (err) {
      // Rollback: restore original file if folder creation or move failed
      try {
        await vscode.workspace.fs.rename(tempUri, fileUri, { overwrite: false });
      } catch {
        // If rollback fails, temp file still exists - at least content isn't lost
      }
      throw err;
    }
  } catch (err: any) {
    // Handle permission errors with clearer messages
    if (isPermissionError(err)) {
      throw new Error('Permission denied. Check file permissions and try again.');
    }
    throw err;
  }
}

/**
 * Checks if an error is related to file permissions.
 */
function isPermissionError(err: any): boolean {
  const code = err?.code;
  const message = String(err?.message || '').toLowerCase();
  return code === 'EACCES' || code === 'EPERM' || message.includes('permission');
}

/**
 * Called when the extension is deactivated.
 * Currently performs no cleanup as all resources are managed by VS Code.
 */
export function deactivate() {}
