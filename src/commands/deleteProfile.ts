import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { getProfileManager, PrintProfile } from '../config/profiles';

/**
 * QuickPick item for profile deletion
 */
interface DeleteProfileQuickPickItem extends vscode.QuickPickItem {
  profile: PrintProfile;
}

/**
 * Create QuickPick items for profile deletion
 */
function createDeleteQuickPickItems(profiles: PrintProfile[]): DeleteProfileQuickPickItem[] {
  return profiles.map(profile => ({
    label: profile.name,
    description: `Theme: ${profile.settings.theme}`,
    detail: profile.description,
    profile
  }));
}

/**
 * Command handler for deleting a profile
 */
export async function deleteProfileCommand(context: vscode.ExtensionContext): Promise<void> {
  logger.info('Delete Profile command invoked');

  try {
    // Get all profiles
    const profileManager = getProfileManager(context);
    const profiles = await profileManager.listProfiles();

    // Check if there are any profiles to delete
    if (profiles.length === 0) {
      vscode.window.showInformationMessage('No saved profiles to delete');
      logger.info('No profiles available to delete');
      return;
    }

    // Create QuickPick items
    const items = createDeleteQuickPickItems(profiles);

    // Show QuickPick
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a profile to delete',
      matchOnDescription: true,
      matchOnDetail: true
    });

    // User cancelled
    if (!selected) {
      logger.info('Delete Profile cancelled by user');
      return;
    }

    // Confirm deletion
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete the profile "${selected.profile.name}"?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (confirmation !== 'Delete') {
      logger.info('Delete Profile cancelled: user declined confirmation');
      return;
    }

    // Delete the profile
    const deleted = await profileManager.deleteProfile(selected.profile.name);

    if (deleted) {
      logger.info(`Profile "${selected.profile.name}" deleted successfully`);
      vscode.window.showInformationMessage(`Profile "${selected.profile.name}" deleted successfully`);
    } else {
      logger.warn(`Profile "${selected.profile.name}" not found for deletion`);
      vscode.window.showWarningMessage(`Profile "${selected.profile.name}" could not be found`);
    }

  } catch (error) {
    const errorMessage = 'Failed to delete profile';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the delete profile command
 */
export function registerDeleteProfileCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.deleteProfile',
    () => deleteProfileCommand(context)
  );

  context.subscriptions.push(disposable);
  logger.info('Delete Profile command registered');
}
