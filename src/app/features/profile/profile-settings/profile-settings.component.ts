import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-4 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p class="mt-2 text-gray-600">Manage your account settings and preferences</p>
              </div>
              <a [routerLink]="['/profile']" class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Back to Profile
              </a>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Security Settings -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Security</h3>
              </div>
              <div class="px-6 py-4 space-y-6">
                <!-- Change Password -->
                <div>
                  <h4 class="text-base font-medium text-gray-900 mb-4">Change Password</h4>
                  <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-4">
                    <div>
                      <label for="current_password" class="block text-sm font-medium text-gray-700">Current Password</label>
                      <input
                        type="password"
                        id="current_password"
                        formControlName="current_password"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      @if (passwordForm.get('current_password')?.errors && passwordForm.get('current_password')?.touched) {
                        <p class="mt-1 text-sm text-red-600">Current password is required</p>
                      }
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label for="new_password" class="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          id="new_password"
                          formControlName="new_password"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        @if (passwordForm.get('new_password')?.errors && passwordForm.get('new_password')?.touched) {
                          <p class="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
                        }
                      </div>

                      <div>
                        <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirm_password"
                          formControlName="confirm_password"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        @if (passwordForm.get('confirm_password')?.errors && passwordForm.get('confirm_password')?.touched) {
                          <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
                        }
                      </div>
                    </div>

                    <div class="flex justify-end">
                      <button
                        type="submit"
                        [disabled]="passwordForm.invalid || changingPassword()"
                        class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        @if (changingPassword()) {
                          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Changing...
                        } @else {
                          Change Password
                        }
                      </button>
                    </div>
                  </form>
                </div>

                <!-- Two-Factor Authentication -->
                <div class="border-t border-gray-200 pt-6">
                  <h4 class="text-base font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      <p class="text-xs text-gray-500 mt-1">Status: {{ twoFactorEnabled() ? 'Enabled' : 'Disabled' }}</p>
                    </div>
                    <button
                      (click)="toggleTwoFactor()"
                      [disabled]="togglingTwoFactor()"
                      [class]="twoFactorEnabled() ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
                      class="text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {{ twoFactorEnabled() ? 'Disable' : 'Enable' }} 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notification Settings -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Notifications</h3>
              </div>
              <div class="px-6 py-4">
                <form [formGroup]="notificationForm" (ngSubmit)="onSaveNotifications()" class="space-y-6">
                  <!-- Email Notifications -->
                  <div>
                    <h4 class="text-base font-medium text-gray-900 mb-4">Email Notifications</h4>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Project Updates</label>
                          <p class="text-xs text-gray-500">Receive updates about projects you're involved in</p>
                        </div>
                        <input
                          type="checkbox"
                          formControlName="email_project_updates"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Team Invitations</label>
                          <p class="text-xs text-gray-500">Get notified when you're invited to join teams</p>
                        </div>
                        <input
                          type="checkbox"
                          formControlName="email_team_invitations"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-sm font-medium text-gray-700">System Announcements</label>
                          <p class="text-xs text-gray-500">Important system updates and maintenance notices</p>
                        </div>
                        <input
                          type="checkbox"
                          formControlName="email_system_announcements"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Browser Notifications -->
                  <div class="border-t border-gray-200 pt-6">
                    <h4 class="text-base font-medium text-gray-900 mb-4">Browser Notifications</h4>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Real-time Updates</label>
                          <p class="text-xs text-gray-500">Show browser notifications for real-time updates</p>
                        </div>
                        <input
                          type="checkbox"
                          formControlName="browser_notifications"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-sm font-medium text-gray-700">Sound Alerts</label>
                          <p class="text-xs text-gray-500">Play sound for important notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          formControlName="sound_alerts"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end">
                    <button
                      type="submit"
                      [disabled]="savingNotifications()"
                      class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      @if (savingNotifications()) {
                        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      } @else {
                        Save Preferences
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="bg-white shadow rounded-lg border-red-200">
              <div class="px-6 py-4 border-b border-red-200">
                <h3 class="text-lg font-medium text-red-900">Danger Zone</h3>
              </div>
              <div class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-base font-medium text-red-900">Delete Account</h4>
                    <p class="text-sm text-red-600">Permanently delete your account and all associated data</p>
                  </div>
                  <button
                    (click)="confirmDeleteAccount()"
                    class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            <!-- Success/Error Messages -->
            @if (error()) {
              <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
                  </div>
                </div>
              </div>
            }

            @if (success()) {
              <div class="bg-green-50 border border-green-200 rounded-md p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">Success</h3>
                    <p class="mt-1 text-sm text-green-700">{{ success() }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);

  changingPassword = signal(false);
  savingNotifications = signal(false);
  togglingTwoFactor = signal(false);
  twoFactorEnabled = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  passwordForm: FormGroup = this.fb.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  notificationForm: FormGroup = this.fb.group({
    email_project_updates: [true],
    email_team_invitations: [true],
    email_system_announcements: [true],
    browser_notifications: [true],
    sound_alerts: [false]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const user = this.authStore.user();
    if (user?.profile?.notification_preferences) {
      this.notificationForm.patchValue(user.profile.notification_preferences);
    }
    // Load 2FA status - simulate API call
    this.twoFactorEnabled.set(false);
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('new_password');
    const confirmPassword = group.get('confirm_password');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.success.set('Password changed successfully!');
      this.passwordForm.reset();
      
      // Clear success message after 3 seconds
      setTimeout(() => this.success.set(null), 3000);
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to change password');
    } finally {
      this.changingPassword.set(false);
    }
  }

  async onSaveNotifications(): Promise<void> {
    this.savingNotifications.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.success.set('Notification preferences saved!');
      
      // Clear success message after 3 seconds
      setTimeout(() => this.success.set(null), 3000);
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to save notification preferences');
    } finally {
      this.savingNotifications.set(false);
    }
  }

  async toggleTwoFactor(): Promise<void> {
    this.togglingTwoFactor.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newStatus = !this.twoFactorEnabled();
      this.twoFactorEnabled.set(newStatus);
      this.success.set(`Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => this.success.set(null), 3000);
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to toggle two-factor authentication');
    } finally {
      this.togglingTwoFactor.set(false);
    }
  }

  confirmDeleteAccount(): void {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      this.deleteAccount();
    }
  }

  private async deleteAccount(): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would delete the account and redirect to login
      alert('Account deletion would be processed here');
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to delete account');
    }
  }
}
