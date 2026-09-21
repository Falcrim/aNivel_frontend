import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly maxWidthClass = input<string>('max-w-lg');

  readonly close = output<void>();
  readonly closeModalOutput = output<void>({ alias: 'closeModal' });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
    this.closeModalOutput.emit();
  }
}
