import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

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
  selectedProject = signal<Project | null>(null);
  isProcessing = signal(false);

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
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    const name = this.projectNameForm().trim();
    if (!name) return;

    this.isProcessing.set(true);
    this.projectService.createProject({ name }).subscribe({
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
    this.projectService.updateProject(proj.id, { name }).subscribe({
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
