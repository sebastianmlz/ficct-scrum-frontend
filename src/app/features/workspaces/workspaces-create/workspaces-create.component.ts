import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-workspaces-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, ButtonModule],
  templateUrl: './workspaces-create.component.html',
  styleUrl: './workspaces-create.component.css'
})
export class WorkspacesCreateComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]],
      description: [''],
      workspace_type: ['', Validators.required],
      visibility: ['public', Validators.required],
      is_active: [true, Validators.required]
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  normalizeSlug(name: string): string {
    // Normaliza el slug: minúsculas, guiones, sin acentos
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    // Normalizar slug antes de enviar
    const name = this.form.value.name;
    const slug = this.normalizeSlug(this.form.value.slug || name);
    this.form.patchValue({ slug });

    // Obtener el UUID de la organización desde la query param
    const organization = this.route.snapshot.queryParamMap.get('organization') || '';

    // Si hay archivo, usar FormData (multipart/form-data), sino JSON
    if (this.selectedFile && this.selectedFile.size > 0) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('slug', slug);
      formData.append('description', this.form.value.description || '');
      formData.append('workspace_type', this.form.value.workspace_type);
      formData.append('visibility', this.form.value.visibility);
      formData.append('is_active', this.form.value.is_active ? 'true' : 'false');
      formData.append('organization', organization);
  formData.append('cover_image', this.selectedFile, this.selectedFile.name);
      
      this.workspaceService.createWorkspace(formData).subscribe({
        next: () => {
          this.success = 'Workspace creado correctamente';
          this.form.reset({ is_active: true, visibility: 'public' });
          this.selectedFile = null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear workspace';
          this.loading = false;
        }
      });
    } else {
      // Sin archivo, usar JSON
      const payload = {
        name: this.form.value.name,
        slug: slug,
        description: this.form.value.description || '',
        workspace_type: this.form.value.workspace_type,
        visibility: this.form.value.visibility,
        is_active: this.form.value.is_active,
        organization: organization
      };
      
      this.workspaceService.createWorkspace(payload).subscribe({
        next: () => {
          this.success = 'Workspace creado correctamente';
          this.form.reset({ is_active: true, visibility: 'public' });
          this.selectedFile = null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear workspace';
          this.loading = false;
        }
      });
    }
  }
}
