import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialBudgetItem } from '../../../../../core/models/material-budget.model';
import { CurrencyClpPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { PercentPipe } from '../../../../../shared/pipes/percent.pipe';

@Component({
  selector: 'app-budget-items-table',
  standalone: true,
  imports: [CommonModule, CurrencyClpPipe, PercentPipe],
  templateUrl: './budget-items-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetItemsTableComponent {
  items = input.required<MaterialBudgetItem[]>();
  showSubcategoryColumn = input<boolean>(false);

  edit = output<MaterialBudgetItem>();
  delete = output<MaterialBudgetItem>();
}
