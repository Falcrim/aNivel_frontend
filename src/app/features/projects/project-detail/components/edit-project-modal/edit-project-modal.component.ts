import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, ProjectStatus, UpdateProjectDto } from '../../../../../core/models/project.model';
import { ProjectService } from '../../../../../core/services/project.service';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-edit-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './edit-project-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProjectModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly project = input<Project | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly projectService = inject(ProjectService);

  readonly name = signal<string>('');
  readonly status = signal<ProjectStatus>('budget');
  readonly builtArea = signal<number>(0);
  readonly exchangeRate = signal<number>(6.97);
  readonly isSaving = signal<boolean>(false);

  readonly statusOptions: CustomSelectOption[] = [
    { value: 'budget', label: 'En Presupuesto' },
    { value: 'active', label: 'Activa / En Ejecución' },
    { value: 'paused', label: 'Pausada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'completed', label: 'Finalizada' },
  ];

  constructor() {
    effect(() => {
      const p = this.project();
      if (p && this.isOpen()) {
        this.name.set(p.name);
        this.status.set(p.status || 'budget');
        this.builtArea.set(Number(p.built_area) || 0);
        this.exchangeRate.set(Number(p.exchange_rate) || 6.97);
      }
    });
  }

  onSubmit(): void {
    const p = this.project();
    if (!p) return;

    const trimmedName = this.name().trim();
    if (!trimmedName) return;

    this.isSaving.set(true);
    const dto: UpdateProjectDto = {
      name: trimmedName,
      status: this.status(),
      built_area: Number(this.builtArea()) || 0,
      exchange_rate: Number(this.exchangeRate()) || 6.97,
    };

    this.projectService.updateProject(p.id, dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }
}
