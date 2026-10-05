import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button, Field } from '@routeops/shared/ui';
import { ExpenseAccessError } from '../application/expense-access-error';
import { ExpenseRepository } from '../application/expense-repository';
import {
  availableChoices,
  Expense,
  expenseCategories,
  ExpenseChoices,
  ExpenseDetails,
  ExpenseOrganization,
  ExpenseProblem,
  emptyExpenseDetails,
} from '../domain/expense';
import { expenseDetailsSchema } from './expense-fields';
import { expensesText } from './expenses-text';

@Component({
  selector: 'app-expense-form',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './expense-form.html',
})
export class ExpenseForm {
  private readonly repository = inject(ExpenseRepository);

  readonly organization = input.required<ExpenseOrganization>();
  readonly choices = input.required<ExpenseChoices>();
  readonly details = input.required<ExpenseDetails>();
  // The expense being edited, or null when adding one.
  readonly expenseId = input<string | null>(null);
  readonly saved = output<Expense>();
  readonly removed = output<void>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(expensesText);
  private readonly problems = computed(() => this.text().problems);
  protected readonly categories = expenseCategories;

  protected readonly busy = signal(false);
  protected readonly confirmingRemove = signal(false);
  protected readonly problem = signal<ExpenseProblem | null>(null);
  protected readonly model = signal<ExpenseDetails>(emptyExpenseDetails(''));
  protected readonly expenseForm = form(this.model, (field) => {
    apply(
      field,
      expenseDetailsSchema(
        this.problems,
        computed(() => this.organization().currency),
      ),
    );
  });
  protected readonly vehicles = computed(() =>
    availableChoices(this.choices().vehicles, this.model().vehicleId),
  );
  protected readonly drivers = computed(() =>
    availableChoices(this.choices().drivers, this.model().driverId),
  );
  protected readonly descriptionOptional = computed(
    () => this.model().category !== 'other',
  );

  constructor() {
    effect(() => {
      const details = this.details();
      untracked(() => {
        this.expenseForm().reset(details);
        this.problem.set(null);
        this.confirmingRemove.set(false);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.expenseForm, async () => {
      this.busy.set(true);
      this.problem.set(null);
      try {
        const expenseId = this.expenseId();
        const saved = expenseId
          ? await this.repository.update(
              this.organization(),
              expenseId,
              this.model(),
            )
          : await this.repository.add(this.organization(), this.model());
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof ExpenseAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.busy.set(false);
      }
    });
  }

  protected async remove(): Promise<void> {
    const expenseId = this.expenseId();
    if (!expenseId) {
      return;
    }
    if (!this.confirmingRemove()) {
      this.confirmingRemove.set(true);
      return;
    }
    this.busy.set(true);
    this.problem.set(null);
    try {
      await this.repository.remove(this.organization(), expenseId);
      this.removed.emit();
    } catch (error) {
      this.problem.set(
        error instanceof ExpenseAccessError ? error.problem : 'remove',
      );
    } finally {
      this.busy.set(false);
      this.confirmingRemove.set(false);
    }
  }
}
