import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectExpenseService } from '../../../../../core/services/project-expense.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { ProjectExpense } from '../../../../../core/models/project-expense.model';
import { CurrencyClpPipe, UsdPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AddExpenseModalComponent } from './add-expense-modal/add-expense-modal.component';
import { DocumentPreviewModalComponent } from '../document-preview-modal/document-preview-modal.component';
import { ProjectDocument } from '../../../../../core/models/project-document.model';
import {
  CustomSelectComponent,
  CustomSelectOption,
} from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-project-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyClpPipe,
    UsdPipe,
    ConfirmDialogComponent,
    AddExpenseModalComponent,
    DocumentPreviewModalComponent,
    CustomSelectComponent,
  ],
  templateUrl: './project-expenses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectExpensesComponent implements OnInit {
  readonly projectId = input.required<number>();

  protected readonly expenseService = inject(ProjectExpenseService);
  protected readonly projectService = inject(ProjectService);

  readonly searchTerm = signal<string>('');
  readonly selectedCategoryFilter = signal<string>('all');
  readonly selectedStatusFilter = signal<string>('all');
  readonly selectedRendicionFilter = signal<string>('all');

  readonly categoryFilterOptions: CustomSelectOption<string>[] = [
    { label: 'Todas las Categorías', value: 'all' },
    { label: 'Materiales (MA)', value: 'materials' },
    { label: 'Mano de Obra (M.O.)', value: 'labor' },
    { label: 'Gastos Operativos (G.O.)', value: 'operating' },
    { label: 'Costos Administrativos (C.A.)', value: 'administrative' },
    { label: 'Otros Gastos', value: 'other' },
  ];

  readonly statusFilterOptions: CustomSelectOption<string>[] = [
    { label: 'Todos los Estados', value: 'all' },
    { label: 'Pagado', value: 'paid' },
    { label: 'En proceso', value: 'in_process' },
    { label: 'Por cobrar', value: 'pending' },
  ];

  readonly rendicionFilterOptions = computed<CustomSelectOption<string>[]>(() => {
    const list = this.expenseService.summary()?.rendiciones || [];
    const opts: CustomSelectOption<string>[] = [
      { label: 'Todas las Rendiciones', value: 'all' },
    ];
    for (const r of list) {
      opts.push({ label: `Rendición ${r}`, value: r });
    }
    return opts;
  });

  readonly exchangeRate = computed(() => {
    return Number(this.projectService.selectedProject()?.exchange_rate) || 6.97;
  });

  readonly totalAmountUsd = computed(() => {
    const sumBs = Number(this.expenseService.summary()?.total_amount) || 0;
    const rate = this.exchangeRate();
    return rate > 0 ? Number((sumBs / rate).toFixed(2)) : 0;
  });

  readonly isAddModalOpen = signal<boolean>(false);
  readonly isPreviewReceiptOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly docToPreview = signal<ProjectDocument | null>(null);
  readonly expenseToDelete = signal<ProjectExpense | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly filteredExpenses = computed<ProjectExpense[]>(() => {
    const list = this.expenseService.expenses();
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategoryFilter();
    const stat = this.selectedStatusFilter();
    const rend = this.selectedRendicionFilter();

    return list.filter((e) => {
      if (cat !== 'all' && e.category_type !== cat) return false;
      if (stat !== 'all' && e.payment_status !== stat) return false;
      if (rend !== 'all' && e.rendicion_number !== rend) return false;

      if (!term) return true;
      const itemMatch = e.item_name.toLowerCase().includes(term);
      const subcatMatch = e.subcategory_name?.toLowerCase().includes(term) ?? false;
      const supplierMatch = e.supplier_name?.toLowerCase().includes(term) ?? false;
      const detailsMatch = e.details?.toLowerCase().includes(term) ?? false;
      const rendMatch = e.rendicion_number?.toLowerCase().includes(term) ?? false;
      const receiptMatch = e.receipt_number?.toLowerCase().includes(term) ?? false;

      return (
        itemMatch ||
        subcatMatch ||
        supplierMatch ||
        detailsMatch ||
        rendMatch ||
        receiptMatch
      );
    });
  });

  constructor() {
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.loadData(pid);
      }
    });
  }

  ngOnInit(): void {
    const pid = this.projectId();
    if (pid) {
      this.loadData(pid);
    }
  }

  loadData(pid: number): void {
    this.expenseService.loadExpenses(pid).subscribe();
    this.expenseService.loadSummary(pid).subscribe();
  }

  openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  openReceiptPreview(expense: ProjectExpense): void {
    if (!expense.receipt_file_url) return;

    // Convert to ProjectDocument representation for modal preview
    const ext = expense.receipt_file_name.split('.').pop()?.toLowerCase() || 'pdf';
    const previewDoc: ProjectDocument = {
      id: expense.id,
      project: expense.project,
      project_name: expense.project_name,
      title: `Comprobante: ${expense.item_name}`,
      document_type: 'other',
      document_type_display: 'Factura / Comprobante de Compra',
      file_url: expense.receipt_file_url,
      file_name: expense.receipt_file_name,
      file_size: expense.receipt_file_size,
      file_size_formatted: expense.receipt_file_size_formatted,
      file_extension: ext,
      supplier_name: expense.supplier_name,
      quoted_amount: expense.total_price,
      currency: 'BOB',
      subcategory: expense.subcategory,
      subcategory_name: expense.subcategory_name,
      notes: expense.details,
      created_at: expense.expense_date,
    };

    this.docToPreview.set(previewDoc);
    this.isPreviewReceiptOpen.set(true);
  }

  closeReceiptPreview(): void {
    this.isPreviewReceiptOpen.set(false);
    this.docToPreview.set(null);
  }

  downloadReceipt(doc: ProjectDocument): void {
    if (!doc.file_url) return;
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.file_name || 'comprobante';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openDeleteModal(expense: ProjectExpense): void {
    this.expenseToDelete.set(expense);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.expenseToDelete.set(null);
  }

  confirmDelete(): void {
    const item = this.expenseToDelete();
    if (!item) return;

    this.isDeleting.set(true);
    this.expenseService.deleteExpense(item.id, this.projectId()).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.isDeleting.set(false);
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'in_process') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  getCategoryBadgeClass(type: string): string {
    if (type === 'materials') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (type === 'labor') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (type === 'operating') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (type === 'administrative') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
