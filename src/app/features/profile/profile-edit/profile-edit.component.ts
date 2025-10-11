import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';
import { User } from '../../../core/models/interfaces';
import { TimezoneEnum, LanguageEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    bio: [''],
    phone_number: [''],
    website_url: [''],
    github_username: [''],
    linkedin_url: [''],
    timezone: [''],
    language: ['']
  });

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.authStore.user();
    if (user) {
      this.profileForm.patchValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        bio: user.profile?.bio || '',
        phone_number: user.profile?.phone_number || '',
        website_url: user.profile?.website_url || '',
        github_username: user.profile?.github_username || '',
        linkedin_url: user.profile?.linkedin_url || '',
        timezone: user.profile?.timezone || '',
        language: user.profile?.language || ''
      });
    }
    this.loading.set(false);
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const formData = this.profileForm.value;
      const user = this.authStore.user();
      if (!user || !user.id) throw new Error('No user ID found');
      // Call the AuthStore updateProfile method with user id
      const updatedUser = await this.authStore.updateProfile(user.id, formData);
      if (updatedUser) {
        this.success.set('Profile updated successfully!');
        setTimeout(() => {
          this.success.set(null);
          this.router.navigate(['/profile']);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      this.error.set(error.error?.message || error.message || 'Failed to update profile');
    } finally {
      this.saving.set(false);
    }
  }
}
