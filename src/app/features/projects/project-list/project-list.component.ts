import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CreateProjectDto, Project, ProjectStatus, UpdateProjectDto } from '../../../core/models/project.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    CustomSelectComponent,
  ],
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListComponent implements OnInit {
  protected readonly projectService = inject(ProjectService);

  searchTerm = signal('');
  viewMode = signal<'grid' | 'table'>('grid');

  // Modals state
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);

  // Form state
  projectNameForm = signal('');
  projectStatusForm = signal<ProjectStatus>('budget');
  projectBuiltAreaForm = signal<number>(0);
  projectExchangeRateForm = signal<number>(6.97);
  selectedProject = signal<Project | null>(null);
  isProcessing = signal(false);

  readonly statusOptions: CustomSelectOption[] = [
    { value: 'budget', label: 'En Presupuesto' },
    { value: 'active', label: 'Activa / En Ejecución' },
    { value: 'paused', label: 'Pausada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'completed', label: 'Finalizada' },
  ];

  filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.projectService.projects();
    if (!term) return list;
    return list.filter((p) => p.name.toLowerCase().includes(term) || p.id.toString().includes(term));
  });

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe();
  }

  // Create
  openCreateModal(): void {
    this.projectNameForm.set('');
    this.projectStatusForm.set('budget');
    this.projectBuiltAreaForm.set(0);
    this.projectExchangeRateForm.set(6.97);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    const name = this.projectNameForm().trim();
    if (!name) return;

    this.isProcessing.set(true);
    const dto: CreateProjectDto = {
      name,
      status: this.projectStatusForm(),
      built_area: Number(this.projectBuiltAreaForm()) || 0,
      exchange_rate: Number(this.projectExchangeRateForm()) || 6.97,
    };

    this.projectService.createProject(dto).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeCreateModal();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // Edit
  openEditModal(project: Project): void {
    this.selectedProject.set(project);
    this.projectNameForm.set(project.name);
    this.projectStatusForm.set(project.status || 'budget');
    this.projectBuiltAreaForm.set(Number(project.built_area) || 0);
    this.projectExchangeRateForm.set(Number(project.exchange_rate) || 6.97);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedProject.set(null);
  }

  submitEdit(): void {
    const proj = this.selectedProject();
    const name = this.projectNameForm().trim();
    if (!proj || !name) return;

    this.isProcessing.set(true);
    const dto: UpdateProjectDto = {
      name,
      status: this.projectStatusForm(),
      built_area: Number(this.projectBuiltAreaForm()) || 0,
      exchange_rate: Number(this.projectExchangeRateForm()) || 6.97,
    };

    this.projectService.updateProject(proj.id, dto).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeEditModal();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // Delete
  openDeleteModal(project: Project): void {
    this.selectedProject.set(project);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedProject.set(null);
  }

  submitDelete(): void {
    const proj = this.selectedProject();
    if (!proj) return;

    this.isProcessing.set(true);
    this.projectService.deleteProject(proj.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }
}
