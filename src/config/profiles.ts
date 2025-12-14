import * as vscode from 'vscode';
import { PrintSettings } from './settings';

/**
 * Print profile that stores all print settings with a name and description
 */
export interface PrintProfile {
  name: string;
  description?: string;
  settings: PrintSettings;
}

/**
 * Storage key for profiles in global state
 */
const PROFILES_STORAGE_KEY = 'vsprint.profiles';

/**
 * Maximum number of profiles allowed to prevent storage abuse
 */
const MAX_PROFILES = 50;

/**
 * Profile manager class for handling profile CRUD operations
 */
export class ProfileManager {
  constructor(private readonly globalState: vscode.Memento) {}

  /**
   * Get all saved profiles
   * @returns Array of PrintProfile objects
   */
  async listProfiles(): Promise<PrintProfile[]> {
    return this.globalState.get<PrintProfile[]>(PROFILES_STORAGE_KEY, []);
  }

  /**
   * Save a new profile or update an existing one
   * @param profile The profile to save
   * @throws Error if profile name is empty, duplicate (on new), or limit exceeded
   */
  async saveProfile(profile: PrintProfile): Promise<void> {
    // Validate profile name
    if (!profile.name || profile.name.trim().length === 0) {
      throw new Error('Profile name cannot be empty');
    }

    // Normalize name (trim whitespace)
    profile.name = profile.name.trim();

    // Get existing profiles
    const profiles = await this.listProfiles();

    // Check for duplicate name
    const existingIndex = profiles.findIndex(p => p.name === profile.name);

    if (existingIndex >= 0) {
      // Update existing profile
      profiles[existingIndex] = profile;
    } else {
      // Check profile limit for new profiles
      if (profiles.length >= MAX_PROFILES) {
        throw new Error(`Cannot save profile: maximum of ${MAX_PROFILES} profiles reached`);
      }

      // Add new profile
      profiles.push(profile);
    }

    // Sort profiles alphabetically by name
    profiles.sort((a, b) => a.name.localeCompare(b.name));

    // Save to global state
    try {
      await this.globalState.update(PROFILES_STORAGE_KEY, profiles);
    } catch (error) {
      throw new Error(`Failed to save profile: ${(error as Error).message}`);
    }
  }

  /**
   * Load a profile by name
   * @param name The profile name to load
   * @returns The PrintProfile if found, undefined otherwise
   */
  async loadProfile(name: string): Promise<PrintProfile | undefined> {
    const profiles = await this.listProfiles();
    return profiles.find(p => p.name === name);
  }

  /**
   * Delete a profile by name
   * @param name The profile name to delete
   * @returns true if deleted, false if profile not found
   */
  async deleteProfile(name: string): Promise<boolean> {
    const profiles = await this.listProfiles();
    const filteredProfiles = profiles.filter(p => p.name !== name);

    // Check if anything was actually deleted
    if (filteredProfiles.length === profiles.length) {
      return false; // Profile not found
    }

    // Save updated list
    try {
      await this.globalState.update(PROFILES_STORAGE_KEY, filteredProfiles);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete profile: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a profile with the given name exists
   * @param name The profile name to check
   * @returns true if profile exists, false otherwise
   */
  async profileExists(name: string): Promise<boolean> {
    const profiles = await this.listProfiles();
    return profiles.some(p => p.name === name);
  }

  /**
   * Clear all profiles (mainly for testing)
   * @internal
   */
  async clearAllProfiles(): Promise<void> {
    await this.globalState.update(PROFILES_STORAGE_KEY, []);
  }
}

/**
 * Get profile manager instance
 * @param context VS Code extension context
 * @returns ProfileManager instance
 */
export function getProfileManager(context: vscode.ExtensionContext): ProfileManager {
  return new ProfileManager(context.globalState);
}

/**
 * Apply a profile's settings to the workspace configuration
 * @param profile The profile to apply
 */
export async function applyProfile(profile: PrintProfile): Promise<void> {
  const config = vscode.workspace.getConfiguration('vsprint');

  try {
    // Apply all settings from the profile
    await config.update('fontSize', profile.settings.fontSize, vscode.ConfigurationTarget.Global);
    await config.update('fontFamily', profile.settings.fontFamily, vscode.ConfigurationTarget.Global);
    await config.update('showLineNumbers', profile.settings.showLineNumbers, vscode.ConfigurationTarget.Global);
    await config.update('theme', profile.settings.theme, vscode.ConfigurationTarget.Global);
    await config.update('lineWrap', profile.settings.lineWrap, vscode.ConfigurationTarget.Global);
    await config.update('showWhitespace', profile.settings.showWhitespace, vscode.ConfigurationTarget.Global);
    await config.update('foldedRegions', profile.settings.foldedRegions, vscode.ConfigurationTarget.Global);
    await config.update('showSeparators', profile.settings.showSeparators, vscode.ConfigurationTarget.Global);
    await config.update('header.template', profile.settings.headerTemplate, vscode.ConfigurationTarget.Global);
    await config.update('footer.template', profile.settings.footerTemplate, vscode.ConfigurationTarget.Global);
    await config.update('columns', profile.settings.columns, vscode.ConfigurationTarget.Global);
  } catch (error) {
    throw new Error(`Failed to apply profile settings: ${(error as Error).message}`);
  }
}

/**
 * Get current workspace settings as a profile (without name/description)
 * @param settings The current PrintSettings
 * @param name Profile name
 * @param description Optional profile description
 * @returns A new PrintProfile object
 */
export function createProfileFromSettings(
  settings: PrintSettings,
  name: string,
  description?: string
): PrintProfile {
  return {
    name,
    description,
    settings: { ...settings } // Create a copy to avoid reference issues
  };
}
