import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirmar acción');
  readonly message = input<string>('¿Estás seguro de que deseas realizar esta acción?');
  readonly confirmText = input<string>('Eliminar');
  readonly cancelText = input<string>('Cancelar');
  readonly isDanger = input<boolean>(true);
  readonly loading = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onConfirm(): void {
    if (!this.loading()) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    if (!this.loading()) {
      this.cancel.emit();
    }
  }
}
