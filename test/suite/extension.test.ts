import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('richardwhiteii.vsprint'));
  });

  test('Export HTML command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('vsprint.exportHtml'), 'exportHtml command not registered');
  });

  test('Print File command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('vsprint.printFile'), 'printFile command not registered');
  });

  test('Print Selection command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('vsprint.printSelection'), 'printSelection command not registered');
  });
});
