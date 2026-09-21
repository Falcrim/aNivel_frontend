import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaborBudgetItem } from '../../../../../core/models/labor-budget.model';
import { CurrencyClpPipe } from '../../../../../shared/pipes/currency-clp.pipe';

@Component({
  selector: 'app-labor-items-table',
  standalone: true,
  imports: [CommonModule, CurrencyClpPipe],
  templateUrl: './labor-items-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaborItemsTableComponent {
  items = input.required<LaborBudgetItem[]>();
  showSubcategoryColumn = input<boolean>(false);

  edit = output<LaborBudgetItem>();
  delete = output<LaborBudgetItem>();
}
