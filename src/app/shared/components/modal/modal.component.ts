import { ChangeDetectionStrategy, Component, HostListener, inject, input, output } from '@angular/core';
import { FloatingLayerService } from '../../floating/floating-layer.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  private readonly floatingLayer = inject(FloatingLayerService);

  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly maxWidthClass = input<string>('max-w-lg');

  readonly close = output<void>();
  readonly closeModalOutput = output<void>({ alias: 'closeModal' });

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (event.defaultPrevented || this.floatingLayer.hasOpenLayer()) {
      return;
    }
    if (this.isOpen()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
    this.closeModalOutput.emit();
  }
}
