import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthStore} from '../../../core/store/auth.store';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
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
    confirm_password: ['', [Validators.required]],
  }, {validators: this.passwordMatchValidator});

  notificationForm: FormGroup = this.fb.group({
    email_project_updates: [true],
    email_team_invitations: [true],
    email_system_announcements: [true],
    browser_notifications: [true],
    sound_alerts: [false],
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

    if (newPassword && confirmPassword &&
      newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({mismatch: true});
      return {mismatch: true};
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.success.set('Notification preferences saved!');

      // Clear success message after 3 seconds
      setTimeout(() => this.success.set(null), 3000);
    } catch (error: any) {
      this.error.set(error.error?.message ||
        'Failed to save notification preferences');
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newStatus = !this.twoFactorEnabled();
      this.twoFactorEnabled.set(newStatus);
      this.success.set(`Two-factor authentication ${
        newStatus ? 'enabled' : 'disabled'}!`);

      // Clear success message after 3 seconds
      setTimeout(() => this.success.set(null), 3000);
    } catch (error: any) {
      this.error.set(error.error?.message ||
        'Failed to toggle two-factor authentication');
    } finally {
      this.togglingTwoFactor.set(false);
    }
  }

  confirmDeleteAccount(): void {
    const confirmed = confirm('Are you sure you want to delete your account? ' +
      'This action cannot be undone.');
    if (confirmed) {
      this.deleteAccount();
    }
  }

  private async deleteAccount(): Promise<void> {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would delete the account and redirect to login
      alert('Account deletion would be processed here');
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to delete account');
    }
  }
}
