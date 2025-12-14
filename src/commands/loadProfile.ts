import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { getProfileManager, applyProfile, PrintProfile } from '../config/profiles';

/**
 * QuickPick item for profile selection
 */
interface ProfileQuickPickItem extends vscode.QuickPickItem {
  profile?: PrintProfile;
  isCreateNew?: boolean;
}

/**
 * Create QuickPick items from profiles
 */
function createProfileQuickPickItems(profiles: PrintProfile[]): ProfileQuickPickItem[] {
  const items: ProfileQuickPickItem[] = [];

  // Add "Create New Profile" option at the top
  items.push({
    label: '$(add) Create New Profile',
    description: 'Save current settings as a new profile',
    isCreateNew: true
  });

  // Add separator
  if (profiles.length > 0) {
    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator
    } as ProfileQuickPickItem);
  }

  // Add each profile
  for (const profile of profiles) {
    items.push({
      label: profile.name,
      description: `Theme: ${profile.settings.theme}, Paper: ${getPaperSize(profile)}`,
      detail: profile.description,
      profile
    });
  }

  return items;
}

/**
 * Get paper size display string from profile settings
 */
function getPaperSize(_profile: PrintProfile): string {
  // Since PrintSettings doesn't include PDF settings yet, default to 'A4'
  // This will be updated when PDF settings are added to PrintSettings interface
  return 'A4';
}

/**
 * Command handler for loading a profile
 */
export async function loadProfileCommand(context: vscode.ExtensionContext): Promise<void> {
  logger.info('Load Profile command invoked');

  try {
    // Get all profiles
    const profileManager = getProfileManager(context);
    const profiles = await profileManager.listProfiles();

    // Create QuickPick items
    const items = createProfileQuickPickItems(profiles);

    // Show QuickPick
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: profiles.length > 0
        ? 'Select a print profile to load'
        : 'No saved profiles. Create a new profile to get started.',
      matchOnDescription: true,
      matchOnDetail: true
    });

    // User cancelled
    if (!selected) {
      logger.info('Load Profile cancelled by user');
      return;
    }

    // Handle "Create New Profile" option
    if (selected.isCreateNew) {
      logger.info('User selected "Create New Profile" - invoking save profile command');
      await vscode.commands.executeCommand('vsprint.saveProfile');
      return;
    }

    // Apply the selected profile
    if (selected.profile) {
      await applyProfile(selected.profile);
      logger.info(`Profile "${selected.profile.name}" loaded and applied successfully`);
      vscode.window.showInformationMessage(`Profile "${selected.profile.name}" loaded successfully`);
    }

  } catch (error) {
    const errorMessage = 'Failed to load profile';
    logger.error(errorMessage, error as Error);
    vscode.window.showErrorMessage(`${errorMessage}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Register the load profile command
 */
export function registerLoadProfileCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'vsprint.loadProfile',
    () => loadProfileCommand(context)
  );

  context.subscriptions.push(disposable);
  logger.info('Load Profile command registered');
}
