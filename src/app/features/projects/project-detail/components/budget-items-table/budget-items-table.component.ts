import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetCategoryType, BudgetItem } from '../../../../../core/models/budget-item.model';
import { CurrencyClpPipe, UsdPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { PercentPipe } from '../../../../../shared/pipes/percent.pipe';
import { CompactNumberPipe } from '../../../../../shared/pipes/compact-number.pipe';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-budget-items-table',
  standalone: true,
  imports: [CommonModule, CurrencyClpPipe, UsdPipe, PercentPipe, CompactNumberPipe, InfoTooltipComponent],
  templateUrl: './budget-items-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetItemsTableComponent {
  readonly items = input.required<BudgetItem[]>();
  readonly categoryType = input<BudgetCategoryType>('materials');
  readonly showSubcategoryColumn = input<boolean>(false);

  readonly edit = output<BudgetItem>();
  readonly delete = output<BudgetItem>();

  isParametric(item: BudgetItem): boolean {
    return Number(item.percentage_applied) > 0 && Number(item.target_base_cost) > 0;
  }
}
