import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProjectDocument } from '../../../../../core/models/project-document.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './document-preview-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly document = input<ProjectDocument | null>(null);

  readonly close = output<void>();
  readonly download = output<ProjectDocument>();

  private readonly sanitizer = inject(DomSanitizer);

  readonly isImage = computed<boolean>(() => {
    const ext = this.document()?.file_extension?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  });

  readonly isPdf = computed<boolean>(() => {
    const ext = this.document()?.file_extension?.toLowerCase() || '';
    return ext === 'pdf';
  });

  readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const doc = this.document();
    if (!doc || !doc.file_url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(doc.file_url);
  });

  onDownload(): void {
    const doc = this.document();
    if (doc) {
      this.download.emit(doc);
    }
  }

  closeModal(): void {
    this.close.emit();
  }
}
