import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationRequest } from '../../../core/models/interfaces';
import { OrganizationTypeEnum, SubscriptionPlanEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-organization-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './organization-create.component.html'
})
export class OrganizationCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  loading = false;
  error: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  organizationTypes = [
    { value: OrganizationTypeEnum.STARTUP, label: 'Startup' },
    { value: OrganizationTypeEnum.CORPORATION, label: 'Corporation' },
    { value: OrganizationTypeEnum.NON_PROFIT, label: 'Non-Profit' },
    { value: OrganizationTypeEnum.GOVERNMENT, label: 'Government' },
    { value: OrganizationTypeEnum.EDUCATIONAL, label: 'Educational' },
    { value: OrganizationTypeEnum.OTHER, label: 'Other' }
  ];

  subscriptionPlans = [
    { value: SubscriptionPlanEnum.FREE, label: 'Free' },
    { value: SubscriptionPlanEnum.BASIC, label: 'Basic' },
    { value: SubscriptionPlanEnum.PREMIUM, label: 'Premium' },
    { value: SubscriptionPlanEnum.ENTERPRISE, label: 'Enterprise' }
  ];

  organizationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    organization_type: [''],
    subscription_plan: [''],
    website_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    is_active: [true]
  });

  constructor() {
    // Auto-generate slug from name
    this.organizationForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.organizationForm.get('slug')?.touched) {
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        this.organizationForm.patchValue({ slug });
      }
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log('📁 Archivo seleccionado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file (PNG, JPG, GIF)';
        return;
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.error = 'File size must be less than 10MB';
        return;
      }

      this.selectedFile = file;
      this.error = null; // Limpiar errores previos
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.onerror = (e) => {
        console.error('❌ Error reading file:', e);
        this.error = 'Error reading the selected file';
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async onSubmit(): Promise<void> {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const formData: OrganizationRequest = {
        name: this.organizationForm.value.name,
        slug: this.organizationForm.value.slug,
        description: this.organizationForm.value.description || undefined,
        organization_type: this.organizationForm.value.organization_type || undefined,
        subscription_plan: this.organizationForm.value.subscription_plan || undefined,
        website_url: this.organizationForm.value.website_url || undefined,
        is_active: this.organizationForm.value.is_active,
        logo: this.selectedFile || undefined
      };

      console.log('🚀 Datos del formulario:', formData);
      console.log('📄 Archivo seleccionado:', this.selectedFile);
      console.log('🔍 Valores del form:', this.organizationForm.value);

      const organization = await this.organizationService.createOrganization(formData).toPromise();
      console.log('✅ Organización creada:', organization);
      
      if (organization) {
        this.router.navigate(['/organizations', organization.id]);
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error detalles:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      
      this.error = error.error?.message || error.message || 'Failed to create organization';
    } finally {
      this.loading = false;
    }
  }

  async testSimplePost(): Promise<void> {
    console.log('🧪 Iniciando prueba POST simple...');
    
    this.loading = true;
    this.error = null;

    try {
      const testData: OrganizationRequest = {
        name: 'Test Organization ' + new Date().toLocaleTimeString(),
        slug: 'test-org-' + Date.now(),
        description: 'Organización de prueba creada desde el frontend',
        organization_type: OrganizationTypeEnum.STARTUP,
        subscription_plan: SubscriptionPlanEnum.FREE,
        is_active: true
        // NO incluir logo para evitar problemas de FormData
      };

      console.log('🧪 Datos de prueba (JSON puro):', testData);

      const organization = await this.organizationService.createOrganization(testData).toPromise();
      console.log('✅ Organización de prueba creada:', organization);
      
      if (organization) {
        alert('✅ ¡Prueba exitosa! Organización creada: ' + organization.name);
        this.router.navigate(['/organizations', organization.id]);
      }
    } catch (error: any) {
      console.error('❌ Error en prueba:', error);
      this.error = 'Test POST failed: ' + (error.error?.message || error.message);
      alert('❌ Error en prueba: ' + this.error);
    } finally {
      this.loading = false;
    }
  }

  async testWithFile(): Promise<void> {
    if (!this.selectedFile) {
      alert('Por favor selecciona una imagen primero');
      return;
    }

    console.log('🧪 Iniciando prueba POST con archivo...');
    
    this.loading = true;
    this.error = null;

    try {
      const testData: OrganizationRequest = {
        name: 'Test With Image ' + new Date().toLocaleTimeString(),
        slug: 'test-img-' + Date.now(),
        description: 'Organización de prueba CON imagen',
        organization_type: OrganizationTypeEnum.STARTUP,
        subscription_plan: SubscriptionPlanEnum.FREE,
        is_active: true,
        logo: this.selectedFile
      };

      console.log('🧪 Datos de prueba (con archivo):', testData);

      const organization = await this.organizationService.createOrganization(testData).toPromise();
      console.log('✅ Organización con imagen creada:', organization);
      
      if (organization) {
        alert('✅ ¡Prueba con imagen exitosa! Organización creada: ' + organization.name);
        this.router.navigate(['/organizations', organization.id]);
      }
    } catch (error: any) {
      console.error('❌ Error en prueba con archivo:', error);
      this.error = 'Test with file failed: ' + (error.error?.message || error.message);
      alert('❌ Error en prueba con archivo: ' + this.error);
    } finally {
      this.loading = false;
    }
  }

  scrollToBottom(): void {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }
}
