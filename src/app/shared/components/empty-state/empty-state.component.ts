import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input<string>('No se encontraron elementos');
  readonly description = input<string>('Comienza agregando un nuevo registro para visualizarlo aquí.');
  readonly actionText = input<string>('');
  readonly iconType = input<'project' | 'category' | 'subcategory' | 'search'>('project');

  readonly action = output<void>();
}
