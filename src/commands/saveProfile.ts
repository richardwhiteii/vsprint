import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { getSettings } from '../config/settings';
import { getProfileManager, createProfileFromSettings } from '../config/profiles';

/**
 * Command handler for saving current settings as a profile
 */
export async function saveProfileCommand(context: vscode.ExtensionContext): Promise<void> {
  logger.info('Save Profile command invoked');

  try {
    // Get current settings
    const currentSettings = getSettings();

    // Prompt user for profile name
    const profileName = await vscode.window.showInputBox({
      prompt: 'Enter a name for this print profile',
      placeHolder: 'e.g., Code Review, Documentation, Minimal',
      validateInput: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Profile name cannot be empty';
        }
        if (value.trim().length > 50) {
          return 'Profile name must be 50 characters or less';
        }
        return undefined;
      }
    });

    // User cancelled
    if (!profileName) {
      logger.info('Save Profile cancelled by user');
      return;
    }

    // Check if profile already exists
    const profileManager = getProfileManager(context);
    const existingProfile = await profileManager.loadProfile(profileName.trim());

    if (existingProfile) {
      // Ask user to confirm overwrite
      const overwrite = await vscode.window.showWarningMessage(
        `A profile named "${profileName.trim()}" already exists. Do you want to overwrite it?`,
        { modal: true },
        'Overwrite',
        'Cancel'
      );

      if (overwrite !== 'Overwrite') {
        logger.info('Save Profile cancelled: user declined to overwrite existing profile');
        return;
      }
    }

    // Optional: Prompt for description
    const description = await vscode.window.showInputBox({
      prompt: 'Enter an optional description for this profile (press Enter to skip)',
      placeHolder: 'e.g., High contrast theme for printing code reviews',
      validateInput: (value: string) => {
        if (value && value.length > 200) {
          return 'Description must be 200 characters or less';
        }
        return undefined;
      }
    });

    // User cancelled on description
    if (description === undefined) {
      logger.info('Save Profile cancelled by user during description entry');
      return;
    }

    // Create profile from current settings
    const profile = createProfileFromSettings(
      currentSettings,
      profileName.trim(),
      description && description.trim().length > 0 ? description.trim() : undefined
    );

    // Save profile
    await profileManager.saveProfile(profile);

    logger.info(`Profile "${profile.name}" saved successfully`);
    vscode.window.showInformationMessage(`Profile "${profile.name}" saved successfully`);

  } catch (error) {
    const errorMessage = 'Failed to save profile';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the save profile command
 */
export function registerSaveProfileCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.saveProfile',
    () => saveProfileCommand(context)
  );

  context.subscriptions.push(disposable);
  logger.info('Save Profile command registered');
}
